FW = FW or {}
FW.Keys = FW.Keys or {}

local KEY_ALIASES = {
    ARROWUP = 'UP',
    ARROWDOWN = 'DOWN',
    ARROWLEFT = 'LEFT',
    ARROWRIGHT = 'RIGHT',
    ENTER = 'RETURN',
    ESCAPE = 'ESC',
    DELETE = 'DEL',
    INSERT = 'INS',
    PAGEUP = 'PGUP',
    PAGEDOWN = 'PGDN',
    MOUSEWHEELUP = 'MWHEELUP',
    MOUSEWHEELDOWN = 'MWHEELDOWN',
    SCROLLUP = 'MWHEELUP',
    SCROLLDOWN = 'MWHEELDOWN',
    LEFTSHIFT = 'SHIFT',
    RIGHTSHIFT = 'SHIFT',
    LSHIFT = 'SHIFT',
    RSHIFT = 'SHIFT',
    LEFTCTRL = 'CTRL',
    RIGHTCTRL = 'CTRL',
    LCTRL = 'CTRL',
    RCTRL = 'CTRL',
    CONTROL = 'CTRL',
    LEFTALT = 'ALT',
    RIGHTALT = 'ALT',
    LALT = 'ALT',
    RALT = 'ALT',
    OPTION = 'ALT',
    CAPSLOCK = 'CAPS',
    LEFTMOUSE = 'LMOUSE',
    RIGHTMOUSE = 'RMOUSE',
    MIDDLEMOUSE = 'MMOUSE',
    MOUSE3 = 'MMOUSE',
    MOUSE4 = 'MOUSE4',
    MOUSE5 = 'MOUSE5',
    PERIOD = 'DOT',
    FULLSTOP = 'DOT',
    DECIMAL = 'DOT',
    COMMAKEY = 'COMMA',
    PLUSKEY = 'PLUS',
    MINUSKEY = 'MINUS',
    NUMPADPLUS = 'NUMPLUS',
    NUMPADMINUS = 'NUMMINUS',
    NUMPADENTER = 'NUMENTER',
}

local DEFAULT_CONTROLS = {
    W = 32,
    A = 34,
    S = 33,
    D = 35,
    E = 38,
    F = 23,
    G = 47,
    H = 74,
    I = 85,
    J = 311,
    Q = 44,
    R = 45,
    T = 245,
    Y = 246,
    U = 303,
    K = 311,
    L = 182,
    O = 199,
    P = 199,
    X = 73,
    C = 26,
    V = 0,
    Z = 20,
    B = 29,
    N = 249,
    M = 244,

    NUM1 = 157,
    NUM2 = 158,
    NUM3 = 160,
    NUM4 = 164,
    NUM5 = 165,
    NUM6 = 159,
    NUM7 = 161,
    NUM8 = 162,
    NUM9 = 163,
    NUM0 = 162,

    UP = 172,
    DOWN = 173,
    LEFT = 174,
    RIGHT = 175,
    RETURN = 191,
    BACKSPACE = 177,
    TAB = 37,
    ESC = 322,
    SPACE = 22,
    SHIFT = 21,
    CTRL = 36,
    ALT = 19,
    CAPS = 137,
    HOME = 213,
    END = 194,
    PGUP = 10,
    PGDN = 11,
    INS = 121,
    DEL = 178,

    COMMA = 82,
    DOT = 81,
    PLUS = 96,
    MINUS = 84,
    NUMPLUS = 96,
    NUMMINUS = 97,
    NUMENTER = 201,
    SLASH = 218,
    BACKSLASH = 219,
    TILDE = 243,
    GRAVE = 243,

    MWHEELUP = 241,
    MWHEELDOWN = 242,
    LMOUSE = 24,
    RMOUSE = 25,
    MMOUSE = 348,
    MOUSE4 = 182,
    MOUSE5 = 183,
}

DEFAULT_CONTROLS['1'] = DEFAULT_CONTROLS.NUM1
DEFAULT_CONTROLS['2'] = DEFAULT_CONTROLS.NUM2
DEFAULT_CONTROLS['3'] = DEFAULT_CONTROLS.NUM3
DEFAULT_CONTROLS['4'] = DEFAULT_CONTROLS.NUM4
DEFAULT_CONTROLS['5'] = DEFAULT_CONTROLS.NUM5
DEFAULT_CONTROLS['6'] = DEFAULT_CONTROLS.NUM6
DEFAULT_CONTROLS['7'] = DEFAULT_CONTROLS.NUM7
DEFAULT_CONTROLS['8'] = DEFAULT_CONTROLS.NUM8
DEFAULT_CONTROLS['9'] = DEFAULT_CONTROLS.NUM9
DEFAULT_CONTROLS['0'] = DEFAULT_CONTROLS.NUM0

local function NormalizeKeyName(key)
    if type(key) ~= 'string' then
        return nil
    end

    local normalized = key:upper():gsub('%s+', ''):gsub('%-', ''):gsub('_', '')
    return KEY_ALIASES[normalized] or normalized
end

FW.Keys.Map = FW.Keys.Map or {}

for name, controlId in pairs(DEFAULT_CONTROLS) do
    if FW.Keys.Map[name] == nil then
        FW.Keys.Map[name] = controlId
    end
end

function FW.Keys.Register(key, controlId)
    assert(type(controlId) == 'number', 'FW.Keys.Register: controlId muss eine Zahl sein')

    local normalized = NormalizeKeyName(key)
    assert(normalized ~= nil, 'FW.Keys.Register: key muss ein String sein')

    FW.Keys.Map[normalized] = controlId
    return controlId
end

function FW.Keys.RegisterMany(mapping)
    assert(type(mapping) == 'table', 'FW.Keys.RegisterMany: mapping muss eine Tabelle sein')

    for key, controlId in pairs(mapping) do
        FW.Keys.Register(key, controlId)
    end

    return true
end

function FW.Keys.Get(key, fallback)
    if type(key) == 'number' then
        return key
    end

    local normalized = NormalizeKeyName(key)
    if not normalized then
        return fallback
    end

    local controlId = FW.Keys.Map[normalized]
    if controlId == nil then
        return fallback
    end

    return controlId
end

function FW.Keys.Require(key)
    local controlId = FW.Keys.Get(key)
    assert(controlId ~= nil, ('FW.Keys.Require: keine Control-ID fuer "%s" gefunden'):format(tostring(key)))
    return controlId
end

function FW.Keys.Has(key)
    return FW.Keys.Get(key) ~= nil
end

function FW.Keys.Name(key)
    if type(key) == 'number' then
        for name, controlId in pairs(FW.Keys.Map) do
            if controlId == key then
                return name
            end
        end

        return tostring(key)
    end

    return NormalizeKeyName(key)
end
