/*
  The arranger tables have a lot of repetitive stuff for rather simple data, so I can store it a lot
   more compressed in some arrays here, it's less than 1/3 the size of hardcoding it
*/

maskOrder = ["left", "top", "right", "bottom"];
function generateArrangers() {
    for (var name in arrangerGenInfo) {
        var arranger = arrangerGenInfo[name];
        var colour = colourMap[arranger.sigils[0][0].substring(0, 1)]

        var table = `<table class="` + colour + `" id="` + name + `">`;
        for (var y = 0; y < arranger.sigils.length; y++) {
            table += `<tr>\n`
            for (var x = 0; x < arranger.sigils[0].length; x++) {
                var sigil = arranger.sigils[y][x];

                /*
                  The bits in the border number corospond to sides as follows:
                      LTRB
                    0b1100 = L, T
                */
                var borders = sigil;
                var mask = 0b1000;
                for (var i = 0; mask != 0; i++) {
                    if ((arranger.borders[y][x] & mask) != 0) {
                        borders += " " + maskOrder[i];
                    }
                    mask >>= 1;
                }

                table += `<td onclick="placeSigil('` + sigil + `', '` + name + `')" class="`
                         + borders +`"></td>\n`;
            }
            table += `</tr>`;
        }
        document.getElementById(name).outerHTML = table;
    }
}

arrangerGenInfo = {
    A1Gate: {
        sigils: [
            ["DJ1", "DJ1", "DZ1", "DJ2"],
            ["DJ1", "DZ1", "DZ1", "DJ2"],
            ["DJ1", "DZ1", "DJ2", "DJ2"]
        ],
        borders: [
            [12, 7, 14, 14],
            [10, 12, 3, 10],
            [11, 11, 13, 3]
        ]
    },
    AGate: {
        sigils: [
            ["DZ1", "DZ1", "DL1", "DL1"],
            ["DJ1", "DZ1", "DZ1", "DL1"],
            ["DJ1", "DJ1", "DJ1", "DL1"],
            ["DI1", "DI1", "DI1", "DI1"]
        ],
        borders: [
            [13, 6, 13, 6],
            [14, 9, 7, 10],
            [9, 5, 7, 11],
            [13, 5, 5, 7]
        ],
    },
    BGate: {
        sigils: [
            ["DL1", "DL1", "DL1", "DT1"],
            ["DL1", "DZ1", "DT1", "DT1"],
            ["DZ1", "DZ1", "DT2", "DT1"],
            ["DZ1", "DT2", "DT2", "DT2"],
            ["DI1", "DI1", "DI1", "DI1"]
        ],
        borders: [
            [12, 5, 7, 14],
            [11, 14, 13, 2],
            [12, 3, 14, 11],
            [11, 13, 1, 7],
            [13, 5, 5, 7]
        ],
    },
    CGate: {
        sigils: [
            ["DZ1", "DZ1", "DL1", "DL1"],
            ["DJ1", "DZ1", "DZ1", "DL1"],
            ["DJ1", "DJ1", "DJ1", "DL1"],
            ["DT1", "DT1", "DT1", "DT2"],
            ["DL2", "DT1", "DT2", "DT2"],
            ["DL2", "DL2", "DL2", "DT2"]
        ],
        borders: [
            [13, 6, 13, 6],
            [14, 9, 7, 10],
            [9, 5, 7, 11],
            [13, 4, 7, 14],
            [14, 11, 13, 2],
            [9, 5, 7, 11]
        ],
    },
    Connector: {
        sigils: [
            ["ML1", "ML1", "ML1", "MT1"],
            ["ML1", "MT2", "MT1", "MT1"],
            ["MT2", "MT2", "MT2", "MT1"]
        ],
        borders: [
            [12, 5, 7, 14],
            [11, 14, 13, 2],
            [13, 1, 7, 11]
        ],
    },
    Cube: {
        sigils: [
            ["ML1", "ML1", "ML1", "MT1"],
            ["ML1", "MZ1", "MT1", "MT1"],
            ["MZ1", "MZ1", "MT2", "MT1"],
            ["MZ1", "MT2", "MT2", "MT2"]
        ],
        borders: [
            [12, 5, 7, 14],
            [11, 14, 13, 2],
            [12, 3, 14, 11],
            [11, 13, 1, 7]
        ],
    },
    Fan: {
        sigils: [
            ["ML1", "ML1", "ML1", "MT1"],
            ["ML1", "MZ1", "MT1", "MT1"],
            ["MZ1", "MZ1", "MS1", "MT1"],
            ["MZ1", "MT2", "MS1", "MS1"],
            ["MT2", "MT2", "MT2", "MS1"]
        ],
        borders: [
            [12, 5, 7, 14],
            [11, 14, 13, 2],
            [12, 3, 14, 11],
            [11, 14, 9, 6],
            [13, 1, 7, 11]
        ],
    },
    Recorder: {
        sigils: [
            ["MT1", "MT1", "MT1", "MZ1"],
            ["MS1", "MT1", "MZ1", "MZ1"],
            ["MS1", "MS1", "MZ1", "MT2"],
            ["MJ1", "MS1", "MT2", "MT2"],
            ["MJ1", "MJ1", "MJ1", "MT2"]
        ],
        borders: [
            [13, 4, 7, 14],
            [14, 11, 12, 3],
            [9, 6, 11, 14],
            [14, 11, 13, 2],
            [9, 5, 7, 11]
        ],
    },
    Platform: {
        sigils: [
            ["MZ1", "MZ1", "ML1", "ML1"],
            ["MI1", "MZ1", "MZ1", "ML1"],
            ["MI1", "MO1", "MO1", "ML1"],
            ["MI1", "MO1", "MO1", "MT1"],
            ["MI1", "MT2", "MT1", "MT1"],
            ["MT2", "MT2", "MT2", "MT1"]
        ],
        borders: [
            [13, 6, 13, 6],
            [14, 9, 7, 10],
            [10, 12, 6, 11],
            [10, 9, 3, 14],
            [11, 14, 13, 2],
            [13, 1, 7, 11]
        ],
    },
    F1: {
        sigils: [
            ["NL1", "NL1", "NL1", "NZ1"],
            ["NL1", "NZ2", "NZ1", "NZ1"],
            ["NZ2", "NZ2", "NZ1", "NL2"],
            ["NZ2", "NL2", "NL2", "NL2"]
        ],
        borders: [
            [12, 5, 7, 14],
            [11, 14, 12, 3],
            [12, 3, 11, 14],
            [11, 13, 5, 3]
        ],
    },
    F2: {
        sigils: [
            ["NL1", "NL1", "NL1", "NL2", "NL3", "NL3"],
            ["NL1", "NL2", "NL2", "NL2", "NT1", "NL3"],
            ["NL4", "NL4", "NL4", "NT1", "NT1", "NL3"],
            ["NL4", "NT2", "NT2", "NT2", "NT1", "NT3"],
            ["NO1", "NO1", "NT2", "NT4", "NT3", "NT3"],
            ["NO1", "NO1", "NT4", "NT4", "NT4", "NT3"]
        ],
        borders: [
            [12, 5, 7, 14, 13, 6],
            [11, 13, 5, 3, 14, 10],
            [12, 5, 7, 13, 2, 11],
            [11, 13, 4, 7, 11, 14],
            [12, 6, 11, 14, 13, 2],
            [9, 3, 13, 1, 7, 11]
        ],
    },
    F3: {
        sigils: [
            ["NI1", "NI1", "NI1", "NI1", "NI2", "NI2", "NI2", "NI2"],
            ["NI3", "NI3", "NI3", "NI3", "NI4", "NI4", "NI4", "NI4"],
            ["NL1", "NL1", "NL2", "NL2", "NL2", "NS1", "NJ1", "NJ1"],
            ["NL1", "NJ2", "NL2", "NZ1", "NZ1", "NS1", "NS1", "NJ1"],
            ["NL1", "NJ2", "NJ2", "NJ2", "NZ1", "NZ1", "NS1", "NJ1"]
        ],
        borders: [
            [13, 5, 5, 7, 13, 5, 5, 7],
            [13, 5, 5, 7, 13, 5, 5, 7],
            [12, 7, 12, 5, 7, 14, 13, 6],
            [10, 14, 11, 13, 6, 9, 6, 10],
            [11, 9, 5, 7, 9, 7, 11, 11]
        ],
    },
    F4: {
        sigils: [
            ["NT1", "NT1", "NT1", "NS1", "NS1", "NT2"],
            ["NJ1", "NT1", "NS1", "NS1", "NT2", "NT2"],
            ["NJ1", "NJ1", "NJ1", "NS2", "NS2", "NT2"],
            ["NO1", "NO1", "NS2", "NS2", "NO2", "NO2"],
            ["NO1", "NO1", "NZ1", "NZ1", "NO2", "NO2"],
            ["NL1", "NL1", "NL1", "NZ1", "NZ1", "NT3"],
            ["NL1", "NT4", "NZ2", "NZ2", "NT3", "NT3"],
            ["NT4", "NT4", "NT4", "NZ2", "NZ2", "NT3"]
        ],
        borders: [
            [13, 4, 7, 12, 7, 14],
            [14, 11, 13, 3, 13, 2],
            [9, 5, 7, 12, 7, 11],
            [12, 6, 13, 3, 12, 6],
            [9, 3, 13, 6, 9, 3],
            [12, 5, 7, 9, 7, 14],
            [11, 14, 13, 6, 13, 2],
            [13, 1, 7, 9, 7, 11]
        ],
    },
    F5: {
        sigils: [
            ["NT1", "NT1", "NT1", "NS1", "NS1", "NT2", "NT2", "NT2"],
            ["NI1", "NT1", "NS1", "NS1", "NL1", "NL1", "NT2", "NT3"],
            ["NI1", "NO1", "NO1", "NO2", "NO2", "NL1", "NT3", "NT3"],
            ["NI1", "NO1", "NO1", "NO2", "NO2", "NL1", "NZ1", "NT3"],
            ["NI1", "NO3", "NO3", "NO4", "NO4", "NZ1", "NZ1", "NT4"],
            ["NJ1", "NO3", "NO3", "NO4", "NO4", "NZ1", "NT4", "NT4"],
            ["NJ1", "NJ1", "NJ1", "NI2", "NI2", "NI2", "NI2", "NT4"]
        ],
        borders: [
            [13, 4, 7, 12, 7, 13, 4, 7],
            [14, 11, 13, 3, 13, 6, 11, 14],
            [10, 12, 6, 12, 6, 10, 13, 2],
            [10, 9, 3, 9, 3, 11, 14, 11],
            [11, 12, 6, 12, 6, 12, 3, 14],
            [14, 9, 3, 9, 3, 11, 13, 2],
            [9, 5, 7, 13, 5, 5, 7, 11]
        ],
    },
    F6: {
        sigils: [
            ["EL1", "EL1", "EL1", "ES1", "EL2", "EL2"],
            ["EL1", "ES2", "ES2", "ES1", "ES1", "EL2"],
            ["ES2", "ES2", "EO1", "EO1", "ES1", "EL2"],
            ["EL3", "ES3", "EO1", "EO1", "ES4", "ES4"],
            ["EL3", "ES3", "ES3", "ES4", "ES4", "EL4"],
            ["EL3", "EL3", "ES3", "EL4", "EL4", "EL4"]
        ],
        borders: [
            [12, 5, 7, 14, 13, 6],
            [11, 12, 7, 9, 6, 10],
            [13, 3, 12, 6, 11, 11],
            [14, 14, 9, 3, 12, 7],
            [10, 9, 6, 13, 3, 14],
            [9, 7, 11, 13, 5, 3]
        ],
    },
    AStar: {
        sigils: [
            ["st1", "st1", "st1", "st2", "st3", "st3", "st3", "st4"],
            ["st1", "st5", "st2", "st2", "st6", "st3", "st4", "st4"],
            ["st5", "st5", "st7", "st2", "st6", "st6", "st4", "st8"],
            ["st5", "st9", "st7", "st7", "st10", "st6", "st8", "st8"],
            ["st9", "st9", "st9", "st7", "st10", "st10", "st10", "st8"]
        ],
        borders: [
            [12, 5, 7, 14, 13, 4, 7, 14],
            [11, 14, 13, 2, 14, 11, 12, 3],
            [12, 3, 14, 11, 9, 6, 11, 14],
            [11, 14, 9, 6, 14, 11, 13, 2],
            [13, 1, 7, 11, 9, 5, 7, 11]
        ],
    },
    BStar: {
        sigils: [
            ["st1", "st1", "st2", "st2", "st2", "st3", "st3", "st3"],
            ["st1", "st4", "st4", "st2", "st5", "st5", "st3", "st6"],
            ["st1", "st4", "st4", "st7", "st7", "st5", "st6", "st6"],
            ["st8", "st8", "st8", "st8", "st7", "st5", "st9", "st6"],
            ["st10", "st10", "st10", "st10", "st7", "st9", "st9", "st9"]
        ],
        borders: [
            [12, 7, 13, 4, 7, 13, 4, 7],
            [10, 12, 6, 11, 13, 6, 11, 14],
            [11, 9, 3, 13, 6, 10, 13, 2],
            [13, 5, 5, 7, 10, 11, 14, 11],
            [13, 5, 5, 7, 11, 13, 1, 7]
        ],
    },
    CStar: {
        sigils: [
            ["st1", "st1", "st1", "st2", "st2", "st2", "st3", "st3"],
            ["st4", "st1", "st5", "st5", "st2", "st3", "st3", "st6"],
            ["st4", "st4", "st4", "st5", "st5", "st6", "st6", "st6"],
            ["st7", "st7", "st7", "st7", "st8", "st8", "st9", "st9"],
            ["st10", "st10", "st10", "st10", "st8", "st8", "st9", "st9"]
        ],
        borders: [
            [13, 4, 7, 13, 4, 7, 12, 7],
            [14, 11, 13, 6, 11, 13, 3, 14],
            [9, 5, 7, 9, 7, 13, 5, 3],
            [13, 5, 5, 7, 12, 6, 12, 6],
            [13, 5, 5, 7, 9, 3, 9, 3]
        ],
    }
};
