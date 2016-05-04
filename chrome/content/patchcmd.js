/* Print generated command line into the text box of the pop-up.
 * The different parts of the line are contained as items of the cmdLine
 * object, which is itself passed as an argument to the dialog window.
 * This enables to recompose the command line by selecting only the parts we
 * want.
 */
(function patchCmdUpdate() {
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

  /* Asynchrony - wait for the text to be added before triggering selection. */
  setTimeout(function () {
    document.getElementById("patchCmdBox").select()
  }, 50); /* A delay of 50 ms seems to be enough, increase it otherwise. */
})();
