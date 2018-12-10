window.addEventListener("load", setup);

seed = Math.floor(Math.random() * 0x7fffffff);
function setup() {
    // Want to store seed in a cookie so refreshing gives the same puzzle
    var cookie = document.cookie.match(/seed=(\d+)/);
    if (cookie == null) {
        saveSeed();
    } else {
        seed = parseInt(cookie[1]);
    }
    document.getElementById("seedDisplay").innerHTML = "Currently: " + seed;
    // Simulate the extra rng calls that happen before sigils are actually randomized
    for (var i = 0; i < 6; i++) {
        rand(0, 0);
    }


    var table = ``;
    for (var i = 0; i < worlds.length; i++) {
        table += `<tr><td id="` + worlds[i] +`" onclick="deselectSigil('`
                 + worlds[i] + `')" class="sigil"></td></tr>\n`;
    }
    document.getElementById("selected").innerHTML = table;

    generateArrangers();
    randomize();
}

function rand(min, max) {
    seed = (214013 * seed + 2531011) % 0x80000000;
    if (min == max) return min;
    return (seed % (max - (min - 1))) + min;
}

function saveSeed() {
    document.cookie = "seed=0; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    var d = new Date();
    d.setTime(d.getTime() + (24*60*60*1000));
    document.cookie = "seed=" + seed + "; expires=" + d.toUTCString() + ";path=/";
}

function newSeed() {
    seedText = document.getElementById("seed").value;
    if (seedText == "") {
        seed = Math.floor(Math.random() * 0x7fffffff);
    } else {
        seed = parseInt(seedText);
    }
    document.getElementById("seedDisplay").innerHTML = "Currently: " + seed;
    saveSeed();

    // Simulate the extra rng calls that happen before sigils are actually randomized
    for (var i = 0; i < 6; i++) {
        rand(0, 0);
    }

    generateArrangers();
    randomize();

    inventory = {
        st: 0,
        DI: 0, DJ: 0, DL: 0, DT: 0, DZ: 0,
        EL: 0, EO: 0, ES: 0,
        MI: 0, MJ: 0, ML: 0, MO: 0, MS: 0, MT: 0, MZ: 0,
        NI: 0, NJ: 0, NL: 0, NO: 0, NS: 0, NT: 0, NZ: 0
    };
}

inventory = {
    st: 0,
    DI: 0, DJ: 0, DL: 0, DT: 0, DZ: 0,
    EL: 0, EO: 0, ES: 0,
    MI: 0, MJ: 0, ML: 0, MO: 0, MS: 0, MT: 0, MZ: 0,
    NI: 0, NJ: 0, NL: 0, NO: 0, NS: 0, NT: 0, NZ: 0
};

colourMap = {
    s: "star",
    D: "green",
    E: "grey",
    M: "yellow",
    N: "red"
};
function placeSigil(sigil, arranger) {
    var colour = "full_" + colourMap[sigil.substring(0, 1)];
    var cells = document.getElementById(arranger).getElementsByClassName(sigil);
    // Deselect sigil
    if (cells[0].classList.contains(colour)) {
        for (i = 0; i < cells.length; i++) {
            cells[i].classList.remove(colour);
        }
        inventory[sigil.substring(0, 2)]++;
    // Select sigil
    } else {
        if (inventory[sigil.substring(0, 2)] > 0) {
            for (i = 0; i < cells.length; i++) {
                cells[i].classList.add(colour);
            }
            inventory[sigil.substring(0, 2)]--;
        }
    }
}

function selectSigil(sigil, world) {
    var cell = document.getElementById(world);

    // The fact that I can't name a variable ** makes this kind of messy
    var oldSigil = cell.innerHTML == "**" ? "st" : cell.innerHTML;
    if (oldSigil != "") {
        if (inventory[oldSigil] == 0) {
            return;
        }
        inventory[oldSigil]--;
    }
    cell.innerHTML = sigil;

    sigil = sigil == "**" ? "st" : sigil;
    inventory[sigil]++;

    cell.className = "sigil pointer " + colourMap[sigil.substring(0, 1)];
}

function deselectSigil(world) {
    var cell = document.getElementById(world);

    var oldSigil = cell.innerHTML == "**" ? "st" : cell.innerHTML;
    if (oldSigil != "") {
        if (inventory[oldSigil] == 0) {
            return;
        }
        inventory[oldSigil]--;
    }
    cell.innerHTML = "";
    cell.className = "sigil";
}
