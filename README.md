# Jade command controller

a simple interpreted command system

NOTE: **the prefix "*" is not required by the base language, and is only implemented in the reader for chat**

## Example Usage:

simple command execution without any arguments
```php
*cmds
```

Passing `"cmds"` into the `<string>` parameter for the `help` command
outputs the description of `cmds`
```php
*help; "cmds"
```

Says `Hello!` in chat.
```php
*var; "myVar" "Hello!" | say; myVar
```

