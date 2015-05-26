// Obfuscat
// ascii characters that display identically in helvetica
sybils = {
 "D": "\u216e", 
 "H": "\u041d", 
 "K": "\u212a", 
 "J": "\u0408", 
 "M": "\u216f", 
 "L": "\u216c", 
 "T": "\u0422", 
 "V": "\u2164", 
 "X": "\u2169", 
 "c": "\u217d", 
 "d": "\u217e", 
 "i": "\u2170", 
 "m": "\u217f", 
 "l": "\u217c", 
 "v": "\u2174", 
 "x": "\u2179"
};

function randomLength() { return Math.ceil(3 * Math.random()); }

function obfuscate(input) {
    // apply translations
    function translate(c) { return c in sybils ? sybils[c] : c; }
    input = input.split('').map(translate).join('');

    // hack for combining characaters/ surrogate pairs etc
    // reverse the string naively and with esrever and if they don't
    // match, just return the reversed version with RTL overide
    var reversed = esrever.reverse(input);
    if (input.split('').reverse().join('') != reversed) {
        return '\u202E' + reversed;
    }

    // randomly reverse groups of characters
    var begin = 0, end = input.length, group, output = "";
    while (begin  < end) {
        // reverse a randomly sized group of characters, using the RTL override
        // character so that they display normally
        var group = Math.min(Math.ceil(5 * Math.random()), end - begin);
        output += '\u202E';
        output += esrever.reverse(input.slice(end - group, end));
        end -= group;

        if (begin >= end) break;
    
        // unreverse a smaller group of characters
        output += '\u202D';
        group = Math.min(Math.ceil(2 * Math.random()), end - begin);
        output += input.slice(begin, begin + group);
        begin += group;
    }

    // hack, trailing whitespace might actually be interior here. fix by
    // inserting an extra RTL overide
    if (output.length && output[output.length-1].trim().length == 0) {
        output += '\u202E';
    }
    return output;
}

function displayObfuscated(input) {
    var output = obfuscate(input);
    $("#textOutput").attr("value", output);
    $("#encoded").text(he.encode(output));
}

var initialInput = "This tool hides the meaning of this text by mangling it with Unicode"
displayObfuscated(initialInput);
$("#textInput").val(initialInput);

$("#textInput").on("change textInput input clear", function(e) {
    displayObfuscated($(this).val());
});
