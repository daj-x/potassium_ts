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
          if (!text) return false;
          const char = text.sub(1, 1);
          return "0123456789".find(char)[0] !== undefined;
     }

     function isCharAlphanumeric(text?: string): boolean {
          if (!text) return false;
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
               throw `error near >>${this.text.sub(this.pos-5, this.pos-1)}<<  ${((message !== undefined) && '| ') + (message || '')}`;
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
                    result = result + this.text;
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
                         }


                    if (isCharAlphanumeric(this.currentChar)) {
                         return new Token(TokenType.IDENT, this.identifier());
                    }

                    this.error("invalid syntax");
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

          protected interpretArgs(): Array<Token> {
               const args: Token[] = [];
               args.push(this.eat());
               while (this.is(TokenType.COMMA)) {
                    args.push(this.eat());
               }
               return args;
          }

          protected interpretCommand(source: Player) {
               this.eat(TokenType.ASTERISK);

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
               let result = executingCommand.exe({'source': source, 'argv': args}); 
               return result.message;
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

          public interpret(source: Player) {
               return this.interpretCommand(source);
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
               public readonly optionalParameters?: CommandParameter[],
          ) {
               Command.registered.push(this);
          }

          /**
           * @virtual 
           */
          public exe(cmdInfo: CommandInfo<t>): CommandResult {
               return {
                    'message': "undefined command",
                    'success': false,
               } satisfies CommandResult;
          }
     }
          
     export function ExecuteCommand(source: Player,commandText: string) {
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

     let cmdT = new Command<[]>(
          "testfor",
          "tests for a certain value",
          PermissionStatus.Limited,
          [
               {
                    name: "value",
                    type: TokenType._ANY
               }
          ]
     );
}
 
// arguments and runtime commands still unimplemented
// work on CommandHandler's command based things, then work on runtime soon

// text chat handler
game.GetService("TextChatService").OnIncomingMessage = (message) => {
     let source: Player|undefined = game.GetService("Players").GetPlayerByUserId(message.TextSource?.UserId || 0);
     if (!source)
          return;

     return undefined;
};

//exec console handler
{
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
               (g[needle] as Callback)(_input);
          }
     });
}