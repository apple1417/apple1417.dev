// As the name implies, randomizes the sigils and makes them display correctly

allSigils = []
    .concat(Array(30).fill("st"))
    .concat(["DI", "DI"])
    .concat(Array(5).fill("DJ"))
    .concat(["DL", "DL", "DL"])
    .concat(Array(4).fill("DT"))
    .concat(Array(4).fill("DZ"))
    .concat(Array(4).fill("EL"))
    .concat(["EO"])
    .concat(Array(4).fill("ES"))
    .concat(["MI"])
    .concat(["MJ"])
    .concat(Array(4).fill("ML"))
    .concat(["MO"])
    .concat(["MS", "MS"])
    .concat(Array(10).fill("MT"))
    .concat(Array(4).fill("MZ"))
    .concat(Array(6).fill("NI"))
    .concat(Array(4).fill("NJ"))
    .concat(Array(10).fill("NL"))
    .concat(Array(7).fill("NO"))
    .concat(Array(4).fill("NS"))
    .concat(Array(12).fill("NT"))
    .concat(Array(6).fill("NZ"));

worldSigilCount = {
    A1: 8, A2: 4, A3: 6, A4: 5, A5: 7, A6: 5, A7: 6, A8: 3,
    B1: 6, B2: 5, B3: 5, B4: 8, B5: 6, B6: 3, B7: 6, B8: 3,
    C1: 5, C2: 5, C3: 5, C4: 6, C5: 7, C6: 4, C7: 5, C8: 3
}

currentSigils = [];
function randomize() {
    // Randomize the sigils
    currentSigils = [];
    for (var index = 0; index < allSigils.length; index++) {
        var otherIndex = rand(0, index);
        currentSigils[index] = allSigils[otherIndex];
        currentSigils[otherIndex] = allSigils[index];
    }

    // Recreate the sigil table
    var sigilIndex = 0;
    var sigilTable = ``;
    for (var world in worldSigilCount) {
        sigilTable += `<tr>\n`;
        sigilTable += `<th>`;
        if (world.endsWith(8)) {
            // \xA0 is a non-breaking space
            sigilTable += world.substring(0, 1) + `\xA0Star`;
        } else {
            sigilTable += world;
        }
        sigilTable += `</th>\n`;

        for (var i = 0; i < 8; i++) {
            if (i < worldSigilCount[world]) {
                var sigil = currentSigils[sigilIndex];
                sigilIndex++;

                var colour = colourMap[sigil.substring(0, 1)];
                if (sigil == "st") {
                    sigil = "**";
                }

                sigilTable += `<td onclick="selectSigil('` + sigil +`', '` + world
                              + `')" class="sigil pointer ` + colour + `">` + sigil + `</td>\n`;
            // Chrome is weird with border-collapse so I need these extra cells
            } else {
                sigilTable += `<td></td>\n`
            }
        }
        sigilTable += `</tr>`;
    }
    document.getElementById("sigils").innerHTML = sigilTable;

    // Empty the selected table
    var selected = document.getElementById("selected")
    for (var i = 0; i < 24; i++) {
        cell = selected.children[0].children[i].children[0];
        cell.innerHTML = ``;
        cell.className = "sigil";
    }
}
