currentPos = 0;
function help(moveAmount) {
    document.getElementById(helpText[currentPos].highlight).classList.remove("highlight");
    document.getElementById("help").style.display = "unset";
    document.getElementById("darkBackground").style.display = "unset";
    document.getElementById("helpButton").style.display = "none";

    currentPos = Math.min(Math.max(currentPos + moveAmount, 0), helpText.length);
    if (currentPos < helpText.length) {
        document.getElementById("helpText").innerHTML = helpText[currentPos].text;
        document.getElementById(helpText[currentPos].highlight).classList.add("highlight");
    } else {
        document.getElementById("help").style.display = "none";
        document.getElementById("darkBackground").style.display = "none";
        document.getElementById("helpButton").style.display = "unset";
        currentPos = 0;
    }

    document.getElementById("previous").disabled = currentPos == 0;
    document.getElementById("next").value = (currentPos == helpText.length - 1) ? "Finish" : "Next";
}

helpText = [
    {
        highlight: "sigils",
        text: "This table contains your sigils. Click on a sigil to select it. You can only select one per row. Selecting another sigil in the same row overwrites the previous one if possible.",
    },
    {
        highlight: "selected",
        text: "When a sigil is selected it will show up in this table. Clicking the sigil here will deselect it if possible."
    },
    {
        highlight: "arrangers",
        text: "Once you've selected a sigil you will be able to place it in one of these arrangers by clicking on one of its spots. Doing so will lock the sigil, preventing you from deselecting it."
    }
]
