//!nocheck
const sendChat = (chat: string) => (game.GetService("TextChatService").WaitForChild("TextChannels").WaitForChild("RBXGeneral") as TextChannel).SendAsync(chat);

const Players = game.GetService("Players");
const LocalPlayer = Players.LocalPlayer;

namespace CommandHandler {
     function isCharWhitespace(text?: string): boolean {
          if (!text)
               return false;
          const char = text.sub(1, 1);
          return char.match("^%s+$")[0] !== undefined;
     }

     function isCharInteger(text?: string): boolean {
          if (!text)
               return false;
          const char = text.sub(1, 1);
          return "0123456789".find(char, 1, true)[0] !== undefined;
     }

     function isCharAlphanumeric(text?: string): boolean {
          if (!text)
               return false;
          const char = text.sub(1, 1);
          const isInt = isCharInteger(char);
          if (isInt)
               return true;
          return "abcdefghijklmnopqrstuvwxyz".find(char.lower(), 1, true)[0] !== undefined;
     }

     let Commands: Array<Command<unknown[]>> = [];
     
     export enum TokenType {
          ASTERISK = "*",
          IDENT = "id",
          SEMI = ";",
          INT = "int", STRING = "str",
          PLUS = "+", MINUS = "-", DIV = "/", MUL = "*",
          MODIFIER = "--",
          QUOT = '"',
          LPAREN = '(',
          RPAREN = ')',
          COMMA = ",",
          PIPE = "|",
          SPACE = " ",
          LBRACE = "{", RBRACE = "}",
          EOF = "end",


          NULL = "null",
          _ANY = "any",
     }

     export enum ModifierType {
          HIDE = "hide"
     }

     const data = new Map<string, [unknown, TokenType]>();
     export let Environment = {
          write(k: string, v: unknown, t: TokenType): void {
               data.set(k, [v, t]);
          },
          read(k: string): [unknown, TokenType] {
               return data.get(k) || [undefined, TokenType.NULL];
          }
     };

     class Token {
          constructor(
               public readonly tokenType: TokenType,
               public readonly value?: unknown
          ) {
               print(`Token(${this.tokenType}, ${this.value})`);
          }
     }

     class Lexer {
          protected pos: number = 0;
          protected currentChar: string = "";

          constructor(
               public readonly text: string
          ) {
               // this.text = this.text.gsub("%s+", " ")[0];
               this.advance();
          }

          protected error(message?: string): void {
               throw `error near >${this.text.sub(this.pos-5, this.pos)}<<--  ${((message !== undefined) && '| ') + (message || '')}`;
          }

          protected advance(): void {
               this.pos++;
               this.currentChar = this.text.sub(this.pos, this.pos);
          }

          protected _peek(): string {
               const _next = this.pos+1;
               return this.text.sub(_next, _next);
          }

          protected skipWhitespace(): void {
               while (isCharWhitespace(this.currentChar)) {
                    this.advance();
               }
          }

          protected integer(): number {
               let result = '';
               while (isCharInteger(this.currentChar) && this.currentChar) {
                    result = result + this.currentChar;
                    this.advance();
               }
               return tonumber(result) as number;
          }

          protected string(quoteType: '"' | "'" | "`"): string {
               let result = '';
               while (this.currentChar !== quoteType && this.currentChar) {
                    result = result + this.currentChar;
                    this.advance();
               }
               this.advance();
               return result;
          }

          protected identifier(): string {
               let result = '';
               while (isCharAlphanumeric(this.currentChar) && this.currentChar) {
                    result = result + this.currentChar;
                    this.advance();
               }
               return result;
          }

          protected getNextToken(): Token {
               while (this.currentChar) {
                    if (isCharWhitespace(this.currentChar)) {
                         this.skipWhitespace();
                         continue;
                    }

                    if (isCharInteger(this.currentChar)) {
                         return new Token(TokenType.INT, this.integer());
                    }
                    
                    switch (this.currentChar) {
                              case "(":
                                   this.advance();
                                   return new Token(TokenType.LPAREN, "(");
                              case ")":
                                   this.advance();
                                   return new Token(TokenType.RPAREN, ")");
                              case "{":
                                   this.advance();
                                   return new Token(TokenType.LBRACE, "{");
                              case "}":
                                   this.advance();
                                   return new Token(TokenType.RBRACE, "}");
                              case '*':
                                   this.advance();
                                   return new Token(TokenType.ASTERISK, "*");
                              case ';':
                                   this.advance();
                                   return new Token(TokenType.SEMI, ";");
                              case ',':
                                   this.advance();
                                   return new Token(TokenType.COMMA, ',');
                              case '"':
                              case '`':
                              case "'":
                                   const quoteType = this.currentChar;
                                   this.advance();
                                   return new Token(TokenType.STRING, this.string(quoteType));
                              case "|":
                                   this.advance();
                                   return new Token(TokenType.PIPE, "|");
                              case "-": {
                                   this.advance();
                                   if (this.currentChar === "-") {
                                        this.advance();
                                        return new Token(TokenType.MODIFIER, "--");
                                   }
                                   return new Token(TokenType.MINUS, "-");
                              }
                         }


                    if (isCharAlphanumeric(this.currentChar)) {
                         return new Token(TokenType.IDENT, this.identifier());
                    }

                    this.error(`unknown symbol "${this.currentChar}"`);
                    return new Token(TokenType.EOF);
               }

               return new Token(TokenType.EOF);
          }
     }

     class Interpreter extends Lexer {
          protected currentToken: Token
          
          constructor(text: string) {
               super(text);
               this.currentToken = this.getNextToken();
          }

          protected eat(t?: TokenType): Token {
               const curType = this.currentToken;
               if ((curType.tokenType === t) || t === undefined) {
                    this.currentToken = this.getNextToken();
               } else {
                    this.error(`expected ${t}; got ${curType.tokenType}`);
               }
               return curType;
          }

          
          protected interpretArgs(cmd: Command<[...unknown[]]>): unknown[] {
               const args: Array<[unknown, TokenType]> = [];
               args.push(this.expr());
               while (!this.is(TokenType.EOF) && !this.is(TokenType.PIPE)) {
                    args.push(this.expr());
               }

               cmd.requiredParameters.forEach((t, i) => {
                    
                    let arg = args[i];
                    warn(`arg mismatch: req:${t.name}, current: ${arg&& arg[1]}`);
                    if (t.type === TokenType._ANY)
                         return;
                    if (!arg) {
                         this.error("argument mismatch");
                         return;                                
                    }
                    if ((!t.type.includes(arg[1]))) {
                         this.error(`invalid cast "${arg[1]}" -> "${t.type.join("|")}"`);
                         return;
                    }
               });

             
               return args;
          }

          protected interpretCommand(source: Player): CommandResult {
               // this.eat(TokenType.ASTERISK); //prefix yo
               // yo DONT have this prefix IMPLEMENT IT SAOMEWHERE ELSE NIGGA

               const command = this.eat(TokenType.IDENT).value;
               
               let executingCommand = Command.registered.find(cmd => cmd.name === command);
               
               if (!executingCommand) {
                    throw `command "${command}" doesnt exist`;
               }

               let modifiers: ModifierType[] = [];
               while (this.is(TokenType.MODIFIER)) {
                    this.eat(TokenType.MODIFIER);
                    const modifierStr = this.eat(TokenType.IDENT);
                    for (const [_, md] of pairs(ModifierType)) {
                         if (modifierStr.value === md) {
                              modifiers.push(modifierStr.value as ModifierType);
                         }
                    }
               }

               if (!this.is(TokenType.SEMI)) {
                    this.eat(TokenType.EOF);
                    return executingCommand.exe({'source': source, 'argv': []});
               }
               this.eat(TokenType.SEMI);
               
               const argv = this.interpretArgs(executingCommand);

               let result = executingCommand.exe({'source': source, 'argv': argv}); 
               if (modifiers.includes(ModifierType.HIDE)) {
                    result.hide = true;
               }
               return result;
          }

          protected expr(): [unknown, TokenType] {
               const tok = this.currentToken;
               switch (this.currentToken.tokenType) {
                    case TokenType.LPAREN: {
                         this.eat(TokenType.LPAREN);
                         const [result, t] = this.expr();
                         this.eat(TokenType.RPAREN);
                         return [result, t];
                    }
                    case TokenType.LBRACE: {
                         this.eat(TokenType.LBRACE);
                         const id = this.eat(TokenType.IDENT).value;
                         let cast: TokenType|undefined;
                         for (const [k, v] of pairs(TokenType)) {
                              if (v === id) {
                                   cast = v;
                                   break;
                              }
                         }
                         if (!cast) {
                              this.error("unknown cast type");
                              throw "";
                         }
                         this.eat(TokenType.RBRACE);
                         return [this.expr()[0], cast];
                    }

                    case TokenType.IDENT:
                         this.eat(TokenType.IDENT);
                         return Environment.read(tok.value as string);
                    case TokenType.STRING:
                         this.eat(TokenType.STRING);
                         return [tok.value, TokenType.STRING];
                    case TokenType.INT:
                         this.eat(TokenType.INT);
                         return [tonumber(tok.value), TokenType.INT];
                    default:
                         this.error("expression failed");
               }
               throw "";
          }

          protected is(t: TokenType) {
               return this.currentToken.tokenType === t;
          }

          public interpret(source: Player): CommandResult[] {
               const results = [];
               results.push(this.interpretCommand(source));
               while (this.is(TokenType.PIPE)) {
                    this.eat(TokenType.PIPE);
                    results.push(this.interpretCommand(source));
               }
               return results;
          }
     }

     interface CommandInfo<t extends unknown[]> {
          readonly source: Player;
          readonly argv: t;
     }

     export interface CommandParameter {
          readonly name: string,
          readonly type: TokenType[] | TokenType._ANY
     }

     export interface CommandResult {
          success: boolean;
          message?: string;
          hide?: true;
     }

     export class Command<t extends unknown[]> {
          public static registered: Command<[...unknown[]]>[] = [];

          public static getCommandFromName(name: string): Command<unknown[]> | undefined {
               let command = this.registered.find(v => {
                    const matches = v.name.lower() === name.lower();
                    if (!matches) {
                         return v.aliases?.includes(name.lower());
                    }
                    return matches;
               });
               return command;
          }

          private bound = [];

          constructor(
               public readonly name: string,
               public readonly description: string,
               public readonly permissionLevel: PermissionStatus,
               public readonly requiredParameters: CommandParameter[],
               public readonly exe: (cmdInfo: CommandInfo<t>) => CommandResult,
               public readonly aliases?: string[],
               public readonly optionalParameters?: CommandParameter[],
          ) {
               this.name = this.name.lower();
               Command.registered.push(this as unknown as Command<[...unknown[]]>);
          }

          public getRequiredParameterTypes(): TokenType[][] {
               const pTypes: TokenType[][] = [];
               this.requiredParameters.forEach((v, i) => {
                    pTypes[i] = v.type as TokenType[];
               });
               return pTypes;
          }

          public getOptionalParameterTypes(): TokenType[][] {
               const pTypes: TokenType[][] = [];
               this.optionalParameters?.forEach((v, i) => {
                    pTypes[i] = v.type as TokenType[];
               });
               return pTypes;
          }
     }
          
     export function ExecuteCommand(source: Player, commandText: string) {
          print("Command executing | raw cmd:", commandText);
          let p = new Interpreter(commandText);
          return p.interpret(source);
     }

     export enum PermissionStatus {
          None,
          Limited,
          Full
     }

     export class Permission {
          public static Registered: Set<Permission> = new Set();
          
          public static GetPlayerPermission(player: Player): PermissionStatus {
               let status = PermissionStatus.None;
               Permission.Registered.forEach(item => {
                    if (item.instPlayer === player) {
                         status = item.status;
                    }
               });
               return status;
          }

          constructor(
               public status: PermissionStatus,
               public chatId: number,
               public instPlayer?: Player,
          ) {
               Permission.Registered.add(this);
          }

          public Remove() {
               Permission.Registered.delete(this);
          }
     }

     const _LOCAL_PERMISSION = new Permission(PermissionStatus.Full, LocalPlayer.UserId, LocalPlayer);

     // internal commands prob dont remove these

     //#region core commands

     // CMDS
     new Command<[]>(
          "cmds",
          "list all the commands",
          PermissionStatus.Limited,
          [],
     (cmdinfo) => {
          let commandNames: string[] = [];
          Command.registered.forEach(v => {
               commandNames.push(v.name);
          });
          return {'success': true, 'message': "Commands: " + commandNames.join(", ")};
     });

     // HELP
     new Command<[string]>(
          "help",
          "retrieve information about the specified command",
          PermissionStatus.Limited,
          [
               {
                    'name': "command",
                    'type': [TokenType.STRING]
               }
          ],
          (cmdInfo) => {
               const result: CommandResult = {
                    'success': false,
                    'message': "unknown"
               };

               const found = Command.getCommandFromName(cmdInfo.argv[0]);
               if (!found) {
                    result.message = "Command doesnt exist";
                    return result;
               }

               let reqParamTypes: string[] = [];
               found.getRequiredParameterTypes().forEach(v => {
                    reqParamTypes.push((typeIs(v, "table") && v.join(" | ")) || v as unknown as string);
               });

               let optParamTypes: string[] = [];
               found.getOptionalParameterTypes().forEach(v => {
                    reqParamTypes.push((typeIs(v, "table") && v.join(" | ")) || v as unknown as string);
               });

               result.success = true;
               result.message = `${found.name} <${reqParamTypes.join("><")}> <${optParamTypes.join("?><")}?>: ${found.description}`;
               
               return result;
          },
          ['-h']
     );

     new Command<[string, unknown, TokenType|undefined]>(
          "var",
          "assign a variable to any value",
          PermissionStatus.Limited,
          [
               {'name': "identifier", "type": [TokenType.STRING]},
               {'name': "value", "type": TokenType._ANY},
          ],
          (cmdInfo) => {
               let ident = cmdInfo.argv[0];
               let value = cmdInfo.argv[1];
               let typeCast = cmdInfo.argv[2];

               Environment.write(ident, value, typeCast || TokenType._ANY);

               return {'success': true, 'message': `${ident} = ${value}`};
          },
          [],
          [
               {'name': "cast type", 'type': [TokenType.IDENT]}
          ]
     );
     //#endregion
}

//#region IMPLEMENTED COMMANDS
{
     const command = CommandHandler.Command;
     const tokenType = CommandHandler.TokenType;
     const permStatus = CommandHandler.PermissionStatus;
     type param = CommandHandler.CommandParameter;

     new command<[string]>(
          "say",
          "say the specified text in chat",
          permStatus.Limited,
          [
               {
                    'name': "text",
                    "type": [tokenType.STRING, tokenType.IDENT]
               }
          ],
          (cmdInfo) => {
               let text = cmdInfo.argv[0];
               sendChat(text);
               return {'hide': true, 'success': true};
          }
     );

     new command<[number]>(
          "speed",
          "set the walkspeed",
          permStatus.Limited,
          [
               {
                    'name': "the speed number",
                    'type': [tokenType.INT]
               }
          ],
          (cmdinfo) => {
               const speed = cmdinfo.argv[0];
               let char = LocalPlayer.Character || LocalPlayer.CharacterAdded.Wait()[0];
               let hum = char.FindFirstChildWhichIsA("Humanoid");
               if (!hum)
                    return {'success': false, 'hide': true};
               hum.WalkSpeed = speed;
               return {'success': true, 'hide': true};
          }
     );
}
 
// text chat handler
const outSend = "$out";
game.GetService("TextChatService").OnIncomingMessage = (message) => {
     task.spawn(() => {
          if (message.Status !== Enum.TextChatMessageStatus.Success) {
               return;
          }
          
          let source: Player|undefined = game.GetService("Players").GetPlayerByUserId(message.TextSource?.UserId || 0);
          if (!source)
               return;

          if (message.Text.sub(1, 1) !== "*")
               return;

          if (message.Text.sub(1, outSend.size()).lower() === outSend.lower()) {
               return;
          }

          let [success, _result] = pcall(CommandHandler.ExecuteCommand, source, message.Text.sub(2));

          if (!success) {
               sendChat(`${outSend}: er: ${(_result as string)?.sub(0, 75)}...`);
               return;
          }

          const result: Array<CommandHandler.CommandResult> = _result as Array<CommandHandler.CommandResult>;


          const outs: string[] = [];
          for (const v of result) {
               if (v.hide) {
                    continue;
               }
               outs.push((v.message?.sub(1, 100)) || "undefined");
          }

          if (result) {
               for (const value of outs) {
                    sendChat(`${outSend}: ${value}`);
                    task.wait(1);
               }
          }
     });

     return undefined;
};

//exec console handler
// dont use i think ts is detected yo
/**@deprecated */
function   _____INIT_CONSOLE() {
     let g = getgenv() as unknown as Record<string, unknown>;
     const needle = "__jade_consoleInterpreter";

     if (g[needle]) {
          g[needle] = undefined;
          rconsoledestroy();
          task.wait(1);
     }
     rconsolecreate();
     rconsolesettitle("jade alt-controller local console");
     // on console input
     g[needle] = (input: string) => {
          if (input === "close") {
               rconsoledestroy();
               g[needle] = undefined;
               return;
          }
          let [success, result] = pcall(CommandHandler.ExecuteCommand, LocalPlayer, input);
          if (!success) {
               rconsoleerror(`er: ${result as unknown as string}\n`);
               return;
          }
          rconsoleprint(`result: ${result as unknown as string}\n`);
     };

     task.spawn(() => {
          while (task.wait() && (g[needle] !== undefined)) {
               const _input = rconsoleinput();
               
               rconsoleprint(`> ${_input}\n`);
               const result = (g[needle] as Callback)(_input);
               if (result) {
                    rconsoleprint(`${result}\n`);
               }
          }
     });
}