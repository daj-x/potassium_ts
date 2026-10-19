/**
 * Potassium Executor Complete Unified Naming Convention (UNC) Definitions (.d.ts)
 * Built for roblox-ts development matching standardized function signatures.
 */

//@ts-nocheck
declare global {
    // --- Closures ---
    function checkcaller(): boolean;
    function clonefunction<T extends (...args: any[]) => any>(f: T): T;
    function getexecutorclosure(f: Callback): boolean; // alias check
    function iscclosure(f: Callback): boolean;
    function islclosure(f: Callback): boolean;
    function isexecutorclosure(f: Callback): boolean;
    function newcclosure<T extends (...args: any[]) => any>(f: T): T;

    // --- Console ---
    function rconsoleclear(): void;
    function rconsolecreate(): void;
    function rconsoledestroy(): void;
    function rconsoleinput(): string;
    function rconsoleprint(text: string): void;
    function rconsolesprint(text: string): void; // Variant
    function rconsoleerror(text: string): void;
    function rconsolesettitle(title: string): void;
    function consoleclear(): void;
    function consolecreate(): void;
    function consoledestroy(): void;
    function consoleinput(): string;
    function consoleprint(text: string): void;
    function consolesave(text: string): void;
    function consoletitle(title: string): void;

    // --- Cryptography ---
    namespace crypt {
        function base64encode(data: string): string;
        function base64decode(data: string): string;
        function encrypt(data: string, key: string, iv?: string): string;
        function decrypt(data: string, key: string, iv?: string): string;
        function hash(data: string, algorithm: string): string;
        function generatebytes(size: number): string;
        function generatekey(): string;
    }
    var base64encode: typeof crypt.base64encode;
    var base64decode: typeof crypt.base64decode;

    // --- Debug Library Extensions ---
    namespace debug {
        function getconstant(f: Callback, index: number): any;
        function getconstants(f: Callback): any[];
        function getproto(f: Callback, index: number): Callback;
        function getprotos(f: Callback): Callback[];
        function getstack(level: number, index?: number): any;
        function getupvalue(f: Callback, index: number): any;
        function getupvalues(f: Callback): Record<string, any>;
        function setconstant(f: Callback, index: number, value: any): void;
        function setstack(level: number, index: number, value: any): void;
        function setupvalue(f: Callback, index: number, value: any): void;
    }

    // --- Filesystem ---
    function appendfile(path: string, content: string): void;
    function delfile(path: string): void;
    function delfolder(path: string): void;
    function isfile(path: string): boolean;
    function isfolder(path: string): boolean;
    function listfiles(path: string): string[];
    function loadfile(path: string): (...args: any[]) => any;
    function makefolder(path: string): void;
    function readfile(path: string): string;
    function writefile(path: string, content: string): void;

    // --- Input ---
    function isrbxactive(): boolean;
    function mouse1click(): void;
    function mouse1press(): void;
    function mouse1release(): void;
    function mouse2click(): void;
    function mouse2press(): void;
    function mouse2release(): void;
    function mousescroll(pixels: number): void;
    function keypress(keycode: number): void;
    function keyrelease(keycode: number): void;
    function setmouseposition(x: number, y: number): void;

    // --- Instances ---
    function fireclickdetector(detector: ClickDetector, distance?: number, event?: string): void;
    function fireproximityprompt(prompt: ProximityPrompt): void;
    function firetouchinterest(part: BasePart, toTouch: BasePart, toggle: number): void;
    function getcallbackvalue(object: Instance, property: string): Callback | undefined;
    function getconnections(signal: RBXScriptSignal): {
        Enabled: boolean;
        ForeignState: boolean;
        Callback: Callback;
        LuaConnection: boolean;
        Thread: thread;
        Fire(...args: any[]): void;
        Defer(...args: any[]): void;
        Disconnect(): void;
        Disable(): void;
        Enable(): void;
    }[];
    function gethiddenproperty(object: Instance, property: string): [any, boolean];
    function gethui(): Instance;
    function getinstances(): Instance[];
    function getnilinstances(): Instance[];
    function getproperties(object: Instance): Record<string, any>;
    function getscriptbytecode(script: LocalScript | ModuleScript): string;
    function getscripthash(script: LocalScript | ModuleScript): string;
    function getsignalconnections(signal: RBXScriptSignal): any[];
    function isscriptable(object: Instance, property: string): boolean;
    function sethiddenproperty(object: Instance, property: string, value: any): boolean;
    function setscriptable(object: Instance, property: string, scriptable: boolean): boolean;
    function firesignal(signal: RBXScriptSignal, ...args: any[]): void;

    // --- Metatables ---
    function getnamecallmethod(): string;
    function getrawmetatable<T = any>(object: T): Record<string, any>;
    function hookfunction<T extends Callback>(target: T, hook: Callback): T;
    function hookmetamethod(object: any, metamethod: string, hook: Callback): Callback;
    function isreadonly(table: table): boolean;
    function setnamecallmethod(method: string): void;
    function setrawmetatable(object: any, metatable: Record<string, any>): void;
    function setreadonly(table: table, readonly: boolean): void;

    // --- Miscellaneous ---
    function identifyexecutor(): [string, string];
    function queueonteleport(script: string): void;
    var queue_on_teleport: typeof queueonteleport;
    function setclipboard(text: string): void;
    function getclipboard(): string;
    function lz4compress(data: string): string;
    function LZ4Compress(): typeof lz4compress;
    function lz4decompress(data: string, size: number): string;
    function LZ4Decompress(): typeof lz4decompress;

    // --- Networking ---
    interface HttpRequestOptions {
        Url: string;
        Url?: string;
        url?: string;
        Method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";
        method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";
        Headers?: Record<string, string>;
        headers?: Record<string, string>;
        Body?: string;
        body?: string;
        Cookies?: Record<string, string>;
        cookies?: Record<string, string>;
    }
    interface HttpResponse {
        Success: boolean;
        StatusCode: number;
        StatusMessage: string;
        Headers: Record<string, string>;
        Body: string;
    }
    function request(options: HttpRequestOptions): HttpResponse;
    var http_request: typeof request;

    // --- Drawing API ---
    type DrawingType = "Line" | "Text" | "Circle" | "Square" | "Image" | "Quad" | "Triangle";

    interface DrawingBase {
        Visible: boolean;
        ZIndex: number;
        Transparency: number;
        Color: Color3;
        Remove(): void;
        Destroy(): void;
    }

    interface DrawingLine extends DrawingBase {
        From: Vector2;
        To: Vector2;
        Thickness: number;
    }

    interface DrawingText extends DrawingBase {
        Text: string;
        Size: number;
        Center: boolean;
        Outline: boolean;
        OutlineColor: Color3;
        Position: Vector2;
        Font: number;
    }

    interface DrawingCircle extends DrawingBase {
        Position: Vector2;
        Radius: number;
        Filled: boolean;
        Thickness: number;
        NumSides: number;
    }

    interface DrawingSquare extends DrawingBase {
        Position: Vector2;
        Size: Vector2;
        Filled: boolean;
        Thickness: number;
        Rounding: number;
    }

    interface DrawingImage extends DrawingBase {
        Data: string;
        DataURL: string;
        Position: Vector2;
        Size: Vector2;
        Rounding: number;
    }

    interface DrawingQuad extends DrawingBase {
        PointA: Vector2;
        PointB: Vector2;
        PointC: Vector2;
        PointD: Vector2;
        Filled: boolean;
        Thickness: number;
    }

    interface DrawingTriangle extends DrawingBase {
        PointA: Vector2;
        PointB: Vector2;
        PointC: Vector2;
        Filled: boolean;
        Thickness: number;
    }

    class Drawing {
         constructor(type: "Line"): DrawingLine;
         constructor(type: "Text"): DrawingText;
         constructor(type: "Circle"): DrawingCircle;
         constructor(type: "Square"): DrawingSquare;
         constructor(type: "Image"): DrawingImage;
         constructor(type: "Quad"): DrawingQuad;
         constructor(type: "Triangle"): DrawingTriangle;
    }

    function cleardrawcache(): void;
    function isrenderobj(obj: any): boolean;
    function getrenderproperty(obj: any, property: string): any;
    function setrenderproperty(obj: any, property: string, value: any): void;

    // --- Scripts ---
    function getgc(includeTables?: boolean): unknown[];
    function getgenv(): typeof globalThis & Record<string, any>;
    function getloadedmodules(excludeCore?: boolean): ModuleScript[];
    function getrenv(): typeof globalThis & Record<string, any>;
    function getrunningscripts(): (LocalScript | ModuleScript)[];
    function getscriptclosure(script: LocalScript | ModuleScript): (...args: any[]) => any;
    function getscripts(): (LocalScript | ModuleScript)[];
    function getsenv(script: LocalScript | ModuleScript): Record<string, any>;
    function getthreadidentity(): number;
    function setthreadidentity(identity: number): void;
}

export {};