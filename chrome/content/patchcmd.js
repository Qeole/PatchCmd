/* Note that "from" is not defined from the headers, but contains the email
 * address associated to default user's identity associated with the email we
 * answer to.
 * TODO: PREFS: Should be made configurable through a preference, and with
 * dynamic checkboxes on the pop-up; meanwhile, you can manually edit here the
 * header you want to use.
 */
let gFieldsToPrint = [
  "prefix",
  "subject",
  "from",
  "to",
  "cc",
  "bcc",
  "message-id",
  "suffix"
];

/* Print generated command line into the text box of the pop-up.
 * The different parts of the line are contained as items of the cmdLine
 * object, which is itself passed as an argument to the dialog window.
 * This enables to recompose the command line by selecting only the parts we
 * want.
 */
(function patchCmdUpdate() {
  let cmdLine = window.arguments[0];

  cmdLine.full = "";
  for (let fieldName of gFieldsToPrint) {
    cmdLine.full += cmdLine[fieldName];
  }

  document.getElementById("patchCmdBox").value = cmdLine.full;

  /* Asynchrony - wait for the text to be added before triggering selection. */
  setTimeout(function () {
    document.getElementById("patchCmdBox").select()
  }, 50); /* A delay of 50 ms seems to be enough, increase it otherwise. */
})();
