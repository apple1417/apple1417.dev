// This is a list of what needs to change between versions
versionInfo = {
    "244": [{
        world: "A3",
        order: ["A3-SfL", "A3-AEP", "A3-LMUStK", "A3-Statue", "A3-Altar"]
    }, {
        world: "B1",
        order: ["B1-WtaD", "B1-Spawn", "B1-RoD"]
    }],
    "326": [{
        world: "A3",
        order: ["A3-LMUStK", "A3-Altar", "A3-AEP", "A3-Statue", "A3-SfL"]
    }, {
        world: "B1",
        order: ["B1-RoD", "B1-WtaD", "B1-Spawn"]
    }]
}

// Look through the list and rearrange as neccessary
currentVersion = "244";
function changeVersion(version) {
    document.getElementById(version).disabled = true;
    document.getElementById(currentVersion).disabled = false;
    currentVersion = version;

    for (var i = 0; i < versionInfo[version].length; i++)  {
        world = versionInfo[version][i].world
        order = versionInfo[version][i].order

        var currentRow = document.getElementById(world);
        var newRow = document.createElement("tr")
        // Save the header
        newRow.appendChild(currentRow.children[0])

        order.forEach(function(name) {
            newRow.appendChild(currentRow.children[name]);
        });

        currentRow.parentElement.replaceChild(newRow, currentRow);
        newRow.id = world;
    }

    // Paint4 works differently, so cause there's only one example hardcode it
    document.getElementById("C8-244").hidden = version != "244";
    document.getElementById("C8-326").hidden = version != "326";
}
