# Jade command controller

a simple interpreted command system

NOTE: **the prefix "*" is not required by the base language, and is only implemented in the reader for chat**

> ## Example Usage:
>
>simple command execution without any arguments
>```php
>*cmds
>```
>
>Passing `"cmds"` into the `<string>` parameter for the `help` command
>outputs the description of `cmds`
>```php
>*help; "cmds"
>```
>
>Says `Hello!` in chat.
>
>- note: for most commands, you will have to explicitly cast the specific type for the argument 
>```php
>*var; "myVar" "Hello!" | say; {str}myVar
>```

## Implementing custom commands

**Using CommandHandler, there's a few things you'll need.**

> - `CommandHandler.Command` - The class for adding new commands
> - `CommandHandler.TokenType` - The argument types
> - `CommandHandler.PermissionStatus` - The minimum permission status that is required for the command

Creating a custom "say" command that chats the first argument 

```ts
// utils
const command = CommandHandler.Command;
const tokenType = CommandHandler.TokenType;
const permStatus = CommandHandler.PermissionStatus;
type param = CommandHandler.CommandParameter;

// making command
new command<[string]>(
      "say", // command
      "say the specified text in chat", // description
      permStatus.Limited,
      [
         {
               'name': "text",
               "type": [tokenType.STRING, tokenType.IDENT]
         } // making the type for the command
      ],
      (cmdInfo) => {
         let text = cmdInfo.argv[0]; // the first argument in the command
         sendChat(text); // TextChatService.TextChannels.RBXGeneral.SendAsync(text: string)
         return {'hide': true, 'success': true}; // Always return `CommandResult`
      }
);

using the command;
   *say; "Hello, im chatting this!";
   *help --HIDE; "say" // outputs nothing, because the --HIDE modifier was added
```
