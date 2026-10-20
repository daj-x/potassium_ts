//!nocheck
const sendChat = (chat: string) => (game.GetService("TextChatService").WaitForChild("TextChannels").WaitForChild("RBXGeneral") as TextChannel).SendAsync(chat);

const Players = game.GetService("Players");
const LocalPlayer = Players.LocalPlayer;

namespace CommandHandler {
     function isCharWhitespace(text?: string): boolean {
          if (!text)
               throw "ok";
          const char = text.sub(1, 1);
          return char.gsub("%s+", "")[0] === "";
     }

     function isCharInteger(text?: string): boolean {
          if (!text)
               throw "ok";
          const char = text.sub(1, 1);
          return "0123456789".find(char)[0] !== undefined;
     }

     function isCharAlphanumeric(text?: string): boolean {
          if (!text)
               throw "ok";
          const char = text.sub(1, 1);
          const isInt = isCharInteger(char);
          if (isInt)
               return true;
          return "abcdefghijklmnopqrstuvwxyz".find(char.lower())[0] !== undefined;
     }

     let Commands: Array<Command<unknown[]>> = [];
     
     export enum TokenType {
          ASTERISK = "*",
          IDENT = "IDENT",
          SEMI = ";",
          INT = "INT", STRING = "STRING",
          PLUS = "+", MINUS = "-", DIV = "/", MUL = "*",
          QUOT = '"',
          LPAREN = '(',
          RPAREN = ')',
          COMMA = ",",
          PIPE = "|",
          EOF = "EOF",

          _ANY = "any",
     }

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
               this.advance();
          }

          protected error(message?: string): void {
               throw `error near >${this.text.sub(this.pos-5, this.pos)}<<--  ${((message !== undefined) && '| ') + (message || '')}`;
          }

          protected advance(): void {
               this.pos++;
               this.currentChar = this.text.sub(this.pos, this.pos);
          }

          protected peek(): string {
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
               while (isCharInteger(this.currentChar)) {
                    result = result + this.currentChar;
                    this.advance();
               }
               return tonumber(result) as number;
          }

          protected string(): string {
               let result = '';
               while (this.currentChar !== '"') {
                    result = result + this.currentChar;
                    this.advance();
               }
               this.advance();
               return result;
          }

          protected identifier(): string {
               let result = '';
               while (isCharAlphanumeric(this.currentChar)) {
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
                              this.advance();
                              return new Token(TokenType.STRING, this.string());
                         case "|":
                              this.advance();
                              return new Token(TokenType.PIPE, "|");
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

          protected interpretArgs(): Token[] {
               const args: Token[] = [];
               args.push(this.eat());
               while (this.is(TokenType.COMMA)) {
                    args.push(this.eat());
               }

               return args;
          }

          protected interpretCommand(source: Player): CommandResult {
               this.eat(TokenType.ASTERISK); //prefix yo

               const command = this.eat(TokenType.IDENT).value;
               
               let executingCommand = Command.registered.find(cmd => cmd.name === command);
               
               if (!executingCommand) {
                    throw `command "${command}" doesnt exist`;
               }

               if (!this.is(TokenType.SEMI)) {
                    this.eat(TokenType.EOF);
                    return executingCommand.exe({'source': source, 'argv': []});
               }
               this.eat(TokenType.SEMI);
               
               const args = this.interpretArgs();
               executingCommand.requiredParameters.forEach((t, i) => {
                    let arg = args[i];
                    if (!arg) {
                         this.error("argument mismatch");
                         return;                                
                    }
                    if ((arg.tokenType !== t.type)) {
                         this.error(`invalid cast "${arg.tokenType}" -> "${t.type}"`);
                         return;
                    }
               });

               const argv: unknown[] = [];
               args.forEach((v, i) => {
                    (argv)[i] = v.value;
               });

               print("ARGV:", argv);

               let result = executingCommand.exe({'source': source, 'argv': argv}); 
               return result;
          }

          protected expr(): unknown {
               switch (this.currentToken.tokenType) {
                    case TokenType.LPAREN: {
                         this.eat(TokenType.LPAREN);
                         const result = this.expr();
                         this.eat(TokenType.RPAREN);
                         return result;
                    }
                    case TokenType.STRING:
                         return this.currentToken.value;
                    case TokenType.INT:
                         return this.currentToken.value;
                    default:
                         this.error("expression failed");
               }
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
          source: Player;
          argv: t;
     }

     interface CommandParameter {
          name: string,
          type: TokenType
     }

     interface CommandResult {
          success: boolean;
          message?: string;
     }

     export class Command<t extends unknown[]> {
          public static registered: Command<[...unknown[]]>[] = [];

          private bound = [];

          constructor(
               public readonly name: string,
               public readonly description: string,
               public readonly permissionLevel: PermissionStatus,
               public readonly requiredParameters: CommandParameter[],
               public readonly exe: (cmdInfo: CommandInfo<t>) => CommandResult,
               public readonly optionalParameters?: CommandParameter[],
          ) {
               this.name = this.name.lower();
               Command.registered.push(this as unknown as Command<[...unknown[]]>);
          }
     }
          
     export function ExecuteCommand(source: Player, commandText: string) {
          print("Command executing | raw cmd:", commandText);
          let p = new Interpreter(commandText);
          return p.interpret(source);
     }

     enum PermissionStatus {
          None,
          Limited,
          Full
     }

     class Permission {
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

     const help = new Command<[TokenType.STRING]>(
          "help",
          "gives information about a certain command",
          PermissionStatus.Limited,
          [
               {
                    'name': "command",
                    'type': TokenType.STRING
               }
          ],
          (cmdInfo) => {
               const result: CommandResult = {
                    'success': false,
                    'message': ""
               };

               const found = Command.registered.find(v => v.name.lower() === cmdInfo.argv[0].lower());
               if (!found) {
                    result.message = "Command doesnt exist";
                    return result;
               }

               result.success = true;
               result.message = `${found.name}: ${found.description}`;
               
               return result;
          }
     );
}
 
// arguments and runtime commands still unimplemented
// work on CommandHandler's command based things, then work on runtime soon

// text chat handler
game.GetService("TextChatService").OnIncomingMessage = (message) => {
     task.spawn(() => {
          if (message.Status !== Enum.TextChatMessageStatus.Success) {
               return;
          }
          
          let source: Player|undefined = game.GetService("Players").GetPlayerByUserId(message.TextSource?.UserId || 0);
          if (!source)
               return;

          let result = CommandHandler.ExecuteCommand(source, message.Text);
          
          const outs: string[] = [];
          result.forEach(v => {
               outs.push((v.success && v.message) || "undefined");
          });

          if (result) {
               task.wait(2);
               sendChat("$dbg: " + tostring(outs.join(", ")));
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