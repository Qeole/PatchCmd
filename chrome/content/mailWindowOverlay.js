Components.utils.import("resource:///modules/mailServices.js");

/* Get header data for the email we answer to, and use it to create the command
 * line. The line is not displayed here: instead we launch a pop-up Dialog
 * object and pass the text command line to it so that it can print it.
 */
function launchPopup() {
  if (!currentHeaderData)
    return;

  let myIdentity = getIdentityForHeader(gFolderDisplay.selectedMessage);
  /* Globally define email from current identity to access it from other
   * functions.
   */
  gMyEmail = myIdentity.email;
  let myFullAdress = myIdentity.fullName ?
                     myIdentity.fullName + " <" + gMyEmail + ">" : gMyEmail;

  /* Contains all the field we will get from the header, plus user-defined
   * prefix and suffix, plus 'from' field we fill with the user email address
   * corresponding with default identity for the mail we answer to.
   *
   * We will enclose the value within single quotes to prevent the shell from
   * interpreting any special character. So we also need to shell-escape inner
   * single quotes.
   *
   * TODO: PREFS: prefix and suffix should be configurable through a user
   * preference.
   */
  let cmdLine = {
    prefix:       "git send-email",
    subject:      "",
    from:         " --from='" + myFullAdress.replace(/'/g, "'\\''") + "'",
    to:           "",
    cc:           "",
    bcc:          "",
    "message-id": "",
    suffix:       ""
  };

  /* Fill cmdLine items attributes with data from the parsed header. */
  for (let headerName in cmdLine) {
    let headerField = currentHeaderData[headerName];
    /* Return if header is not present in the email - this also means that we
     * leave here for prefix and suffix, without changing them.
     */
    if (!headerField || !headerField.headerValue)
      continue;

    let value = headerField.headerValue;
    let option;
    switch (headerName) {
      case "subject":
        cmdLine.subject       = formatOption("--subject",     value);
        break;
      case "message-id":
        cmdLine["message-id"] = formatOption("--in-reply-to", value);
        break;
      case "from":
        /* If I sent that email, skip my address: I do not want to answer to
         * myself. Otherwise, answer to the sender: add them as a recipient
         * (--to).
         */
        if (value.indexOf(gMyEmail) >= 0)
          continue;
        option = formatAddresses("to", value);
        if (option) {
          cmdLine.to          += option;
        }
        break;
      default:
        option = formatAddresses(headerName, value);
        if (option) {
          cmdLine[headerName] += option;
        }
    }
  }

  /* Launch pop-up dialog and pass the cmdLine object to it. */
  window.openDialog('chrome://patchcmd/content/patchCmdLine.xul',
                    'patchCmdLine',
                    'chrome',
                    cmdLine);
}

/* Returns a single formatted option.
 *
 * @param aOptionName Name of the option for the command line, including '--'.
 * @param aValue      Value for the option, to be enclose within singe quotes.
 * @return            A string: the formatted option for the command line.
 *
 * Example:
 *
 * formatOption("--subject", "This is my subject");
 *   returns
 * ␣--subject='This is my subject'
 * (note the space at the beginning).
 */
function formatOption(aOptionName, aValue)
{
    return " " + aOptionName + "='" + aValue.replace(/'/g, "'\\''") + "'";
}

/* Returns, from a list of addresses obtained from an email header, a list of
 * formatted options containing email addresses. If found, the email
 * corresponding to the identity of the current user is excluded from the list.
 *
 * @param aField      Name of the option for the command line, WITHOUT '--'.
 * @param aEmailList  List of the email addresses, potentially including full
 *                    names as well, as parsed from the header.
 * @return            A string: the several formatted options, excluding email
 *                    address of user for current parsed email.
 *                    May alternatively return null if no address (or only the
 *                    user's) is found.
 *
 * Example:
 *
 * formatAddresses("to", "abc@def.gh\n John Doe <john@doe.org>");
 *   returns
 * ␣--to='abc@def.gh' --to='John Doe <john@doe.org>'
 */
function formatAddresses(aField, aEmailList)
{
  if (!aEmailList)
    return;

  let fullNames = {};
  let addresses = {};
  let names     = {};
  let numAddresses = MailServices.
    headerParser.parseHeadersWithArray(aEmailList,
                                       addresses,
                                       fullNames,
                                       names);
  let res = "";
  let index = 0;

  while (index < numAddresses) {
    let address = addresses.value[index];
    if (fullNames.value[index])
      address = fullNames.value[index] + " <" + address + ">";
    index++;

    let optionName = "";
    /* If I am the recipient of the email, or in copy, I probably do not wish
     * to answer to myself; skip my email.
     */
    if (address.indexOf(gMyEmail) >= 0)
      continue;
    optionName = "--" + aField;

    res += " " + optionName + "='" + address.replace(/'/g, "'\\''") + "'";
  }

  return res;
}
