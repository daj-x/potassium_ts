const sendChat = (chat: string) => (game.GetService("TextChatService").WaitForChild("TextChannels").WaitForChild("RBXGeneral") as TextChannel).SendAsync(chat);

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
               throw `error near ${this.text.sub(this.pos-10, this.pos-1)} <-- ${((message !== undefined) && '| ') + (message || '')}`;
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
                    result = result + this.text;
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

          protected eat(t: TokenType) {
               const curType = this.currentToken?.tokenType;
               if (curType === t) {
                    this.currentToken = this.getNextToken();
                    print(`${curType} passed`);
               } else {
                    this.error(`expected ${t}; got ${curType}`);
               }
          }

          protected interpretArgs(): Array<unknown> {
               const args = [];
               args.push(this.expr());
               while (this.is(TokenType.COMMA)) {
                    args.push(this.expr());
               }
               return args;
          }

          protected interpretCommand() {
               this.eat(TokenType.ASTERISK);
               const command = this.currentToken.value;
               this.eat(TokenType.IDENT);
               if (this.is(TokenType.SEMI)) {
                    this.eat(TokenType.SEMI);
                    const args = this.interpretArgs();
               } else if (!this.is(TokenType.EOF)) {
                    this.error("arguments require a ';' symbol");
               }


          }

          protected expr(): unknown {
               switch (this.currentToken.tokenType) {
                    case TokenType.LPAREN: {
                         this.eat(TokenType.LPAREN);
                         const result = this.expr();
                         this.eat(TokenType.RPAREN);
                         return result;
                    }
                    default:
                         this.error("expression failed");
               }
          }

          protected is(t: TokenType) {
               return this.currentToken.tokenType === t;
          }

          public interpret() {
               this.interpretCommand();
          }
     }

     interface CommandInfo<t extends unknown[]> {
          source: Player;
          argv: t;
     }
     interface CommandResult {
          success: boolean;
          message?: string;
     }

     export class Command<t extends unknown[]> {
          private static registered: Command<[...unknown[]]>[] = [];

          private bound = [];

          constructor(
               public readonly name: string,
               public readonly description: string,
               public readonly requiredParameters: TokenType[],
               public readonly permissionLevel: PermissionStatus,
               public readonly optionalParameters?: TokenType[],
          ) {
               Command.registered.push(this);
          }

          public exe(cmdInfo: CommandInfo<t>): CommandResult {
               return {
                    'message': "undefined command",
                    'success': false,
               } satisfies CommandResult;
          }
     }
          
     export function ExecuteCommand(commandText: string) {
          let p = new Interpreter(commandText);
          return p.interpret();
     }
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

let cmd = new CommandHandler.Command<[]>("testfor", "tests for a certain value", [], PermissionStatus.Full);
cmd.exe = (d) => {
     return {message: "", success: true};
};


// interprets the command perfectly
// arguments should be implemented next near 'protected interpretCommand() {...}'
CommandHandler.ExecuteCommand("*help;");