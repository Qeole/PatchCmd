/* Print generated command line into the text box of the pop-up.
 * The different parts of the line are contained as items of the cmdLine
 * object, which is itself passed as an argument to the dialog window.
 * This enables to recompose the command line by selecting only the parts we
 * want.
 */
function patchCmdUpdate() {
  let cmdLine = window.arguments[0];

  /* Get the list of the headers we want to use to create options. */
  let prefs = Components.classes["@mozilla.org/preferences-service;1"]
    .getService(Components.interfaces.nsIPrefService)
    .getBranch("patchCmd.");
  let fieldsToPrint = {
    prefix:       prefs.getBoolPref("useField.prefix"),
    subject:      prefs.getBoolPref("useField.subject"),
    from:         prefs.getBoolPref("useField.from"),
    to:           prefs.getBoolPref("useField.to"),
    cc:           prefs.getBoolPref("useField.cc"),
    bcc:          prefs.getBoolPref("useField.bcc"),
    "message-id": prefs.getBoolPref("useField.message-id"),
    suffix:       prefs.getBoolPref("useField.suffix")
  };

  let resCmdLine = "";

  function fill() {
    return resCmdLine === "" ? "": " ";
  }

  for (let fieldName in fieldsToPrint) {
    if (!fieldsToPrint[fieldName])
      continue;

    let optionName = prefs.getCharPref("optionName." + fieldName);

    /* Two types of items in cmdLine: strings (for single values) and string
     * arrays (for list of emails). Deal accordingly.
     */
    switch(typeof cmdLine[fieldName]) {
      case "string":
        resCmdLine   += fill() + optionName + cmdLine[fieldName];
        break;
      case "object":
        for (let value of cmdLine[fieldName]) {
          resCmdLine += fill() + optionName + value;
        }
        break;
      default:
        resCmdLine   += fill() + optionName;
    }
  }

  /* Apply user-defined post-processing regexp substitution. If none has been
   * defined, this is without effect.
   */
  resCmdLine = resCmdLine.replace(
    new RegExp(prefs.getCharPref("regexp.pattern"),
      prefs.getCharPref("regexp.flags")),
    prefs.getCharPref("regexp.substitute")
  );

  document.getElementById("patchCmdBox").value = resCmdLine;
}

/* Select all text from the generated command line to ease copy/paste. */
function selectAll() {
  document.getElementById("patchCmdBox").select()
}

/* Update the “disabled” property of an option name for a textbox, and its
 * associated label, in accordance with the patchCmd-useField* preference.
 *
 * @param   aId   Full id of the patchCmd-useField preference to check.
 */
function switchStateTextbox(aId) {
  let elemId    = aId.substring("patchCmd-useField".length);
  let textboxId = "optionName" + elemId;
  let labelId   = textboxId    + "Label";
  let prefState = document.getElementById(aId).value;

  /* On preference reset, the value is undefined; fetch the default option from
   * Thunderbird's preferences service.
   */
  if (prefState === undefined)
    prefState = Components.classes["@mozilla.org/preferences-service;1"]
      .getService(Components.interfaces.nsIPrefService)
      .getBoolPref(document.getElementById(aId).name);

  document.getElementById(textboxId).disabled = !prefState;
  document.getElementById(labelId).disabled   = !prefState;
  selectAll();
}

/* Reset both the option name and the field usage for the field of a given row.
 *
 * @param   aId   Id of the reset button that was pressed.
 */
function resetRow(aId) {
  let useFieldId   = aId.replace("resetButton", "patchCmd-useField");
  let optionNameId = aId.replace("resetButton", "patchCmd-optionName");
  document.getElementById(useFieldId).reset();
  document.getElementById(optionNameId).reset();
  selectAll();
}

/* Reset all values for the regexp. */
function resetRegexp() {
  for (let s of ['Pattern', 'Flags', 'Substitute'])
    document.getElementById('patchCmd-regexp' + s).reset();
}

/* Debug function; print arguments in a label on bottom of the pop-up. */
function debug(aInfo, aAppend = false) {
  let label = document.getElementById("patchCmd-debug");
  let info  = JSON.stringify(aInfo);
  if (aAppend && label.value)
    label.value += info;
  else
    label.value  = info;
}
