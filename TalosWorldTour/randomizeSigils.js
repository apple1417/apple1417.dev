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

/*
  In rando the marker list isn't ordered by world, instead it's like follows
  This means I can't just assign the first 8 sigils to A1, then 4 to A2, etc.
  Instead I look through the list to find out what world each index goes to
*/
worldOrder = [
    "A3", "A2", "A3", "A4", "A1", "A5", "A5", "A6",
    "A7", "B1", "B2", "B3", "B4", "B5", "B7", "B7",
    "C1", "C2", "C3", "C4", "C4", "C5", "C5", "B4",
    "--", "--", "C5", "--", "C6", "C7", "A1", "A5",
    "A1", "A1", "A1", "B4", "B5", "A2", "A5", "A7",
    "A5", "A5", "A7", "B4", "A1", "A2", "A3", "A6",
    "A8", "B8", "B8", "C8", "C8", "A8", "B8", "A8",
    "C8", "B7", "B3", "A1", "A2", "B1", "B6", "B7",
    "B1", "B2", "A1", "A3", "A3", "A4", "A4", "B1",
    "B1", "B2", "B3", "B6", "A4", "A4", "B1", "B2",
    "B5", "B6", "B7", "C1", "C4", "C5", "B7", "C1",
    "C3", "C6", "A3", "A6", "A6", "A7", "B2", "B3",
    "B4", "B4", "B5", "C7", "A7", "C2", "C3", "C5",
    "C5", "C6", "C7", "B5", "C2", "C4", "C6", "A7",
    "B3", "B4", "B4", "C1", "C2", "C3", "C4", "C4",
    "C5", "C7", "C7", "A5", "A6", "B5", "C1", "C2",
    "C3"
];
worlds = [
    "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8",
    "B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8",
    "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8",
];

currentSigils = {};
worldSigils = {};
function randomize() {
    // Randomize the sigils
    currentSigils = {};
    for (var index = 0; index < allSigils.length; index++) {
        var otherMarker = rand(0, index);
        currentSigils[index] = currentSigils[otherMarker];
        currentSigils[otherMarker] = index;
    }
    // Convert the sigils to their worlds
    worldSigils = {};
    for (var i in currentSigils) {
        var world = worldOrder[i];
        if (world in worldSigils) {
            worldSigils[world].push(currentSigils[i]);
        } else {
            worldSigils[world] = [currentSigils[i]];
        }
    }
    // Sort the sigils in each world
    for (var w in worldSigils) {
        var world = worldSigils[w];
        var starCount = 0;
        for (var i = 0; i < world.length; i++) {
            if (world[i] < 30) {
                starCount++;
                world.splice(i, 1);
                i--;
            }
        }
        // Why on earth does sorting numbers sort them alphabetically by default
        world.sort(function(a, b) {return a - b;});
        worldSigils[w] = world.concat(Array(starCount).fill(0));
    }

    // Recreate the sigil table
    var sigilTable = ``;
    for (var i = 0; i < worlds.length; i++) {
        var w = worlds[i];
        sigilTable += `<tr>\n`;
        sigilTable += `<th>`;
        if (w.endsWith(8)) {
            sigilTable += w.substring(0, 1) + ` Star`;
        } else {
            sigilTable += w;
        }
        sigilTable += `</th>\n`;

        for (var j = 0; j < 8; j++) {
            if (j < worldSigils[w].length) {
                var sigil = allSigils[worldSigils[w][j]];

                var colour = colourMap[sigil.substring(0, 1)];
                if (sigil == "st") {
                    sigil = "**";
                }

                sigilTable += `<td onclick="selectSigil('` + sigil +`', '` + w
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
