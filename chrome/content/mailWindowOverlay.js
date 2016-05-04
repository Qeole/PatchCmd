Components.utils.import("resource:///modules/mailServices.js");

/* Get header data for the email we answer to, and use it to create the command
 * line. The line is not displayed here: instead we launch a pop-up Dialog
 * object and pass the text command line to it so that it can print it.
 */
function launchPopup() {
  /* Thunderbird parses the headers of currently selected email and stores them
   * in currentHeaderData.
   */
  if (!currentHeaderData)
    return;

  let myIdentity = getIdentityForHeader(gFolderDisplay.selectedMessage);
  /* Globally define email from current identity to access it from other
   * functions.
   */
  gMyEmail = myIdentity.email;
  let myFullAdress = myIdentity.fullName ?
                     myIdentity.fullName + " <" + gMyEmail + ">" : gMyEmail;

  /* Globally define a variable pointing to user preferences for the add-on. */
  gPrefs = Components.classes["@mozilla.org/preferences-service;1"]
    .getService(Components.interfaces.nsIPrefService)
    .getBranch("patchCmd.");

  /* Contains all the field we will get from the header, plus user-defined
   * prefix and suffix.
   *
   * We will enclose the value within single quotes to prevent the shell from
   * interpreting any special character. So we also need to shell-escape inner
   * single quotes.
   *
   * Note that "from" is not defined from the headers, but contains the address
   * associated to default user's identity associated with the email we answer
   * to.
   */
  let cmdLine = {
    subject:      "",
    from:         [ "'" + myFullAdress.replace(/'/g, "'\\''") + "'" ],
    to:           [],
    cc:           [],
    bcc:          [],
    "message-id": "",
  };

  /* Fill cmdLine items attributes with data from the parsed header. */
  for (let headerName in cmdLine) {
    let headerField = currentHeaderData[headerName];
    /* Return if header is not present in the email. */
    if (!headerField || !headerField.headerValue)
      continue;

    let value = headerField.headerValue;
    let option;
    switch (headerName) {
      case "subject":
        cmdLine.subject       = formatOption(value);
        break;
      case "message-id":
        cmdLine["message-id"] = formatOption(value);
        break;
      case "from":
        /* If I sent that email, skip my address: I do not want to answer to
         * myself. Otherwise, answer to the sender: add them as a recipient
         * (--to).
         */
        if (value.indexOf(gMyEmail) >= 0) {
          cmdLine.amITheSender = true;
          continue;
        }
        cmdLine.amITheSender = false;
        option = formatAddresses(value);
        if (option) {
          cmdLine.to = cmdLine.to.concat(option);
        }
        break;
      default:
        option = formatAddresses(value);
        if (option) {
          cmdLine[headerName] = cmdLine[headerName].concat(option);
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
 * @param aValue      Value for the option, to be enclosed within singe quotes.
 *                    Inner quotes are escaped.
 * @return            String: the formatted option value for the command line.
 *
 * Example:
 *
 * formatOption("It's my subject");
 *   returns
 * 'It'\''s my subject'
 */
function formatOption(aValue)
{
    return "'" + aValue.replace(/'/g, "'\\''") + "'";
}

/* Returns, from a list of addresses obtained from an email header, a list of
 * formatted options containing email addresses. If found, the email
 * corresponding to the identity of the current user is excluded from the list.
 *
 * @param aEmailList  List of the email addresses, potentially including full
 *                    names as well, as parsed from the header.
 * @return            Array: the several formatted option values, excluding
 *                    email address of user for current parsed email. Inner
 *                    single quotes are escaped.
 *                    May alternatively return an empty object if no address
 *                    (or only the user's) is found.
 *
 * Example:
 *
 * formatAddresses("abc@def.gh\n <my@own.address>\n John Doe <john@doe.org>");
 *   returns
 * ["'abc@def.gh'", "'John Doe <john@doe.org>'"]
 */
function formatAddresses(aEmailList)
{
  if (!aEmailList)
    return [];

  let fullNames = {};
  let addresses = {};
  let names     = {};
  /* Use Thunderbird email list parser. */
  let numAddresses = MailServices
    .headerParser.parseHeadersWithArray(aEmailList,
                                        addresses,
                                        fullNames,
                                        names);
  let res = [];
  let index = 0;

  while (index < numAddresses) {
    let address = addresses.value[index];
    if (fullNames.value[index])
      address = fullNames.value[index] + " <" + address + ">";
    index++;

    /* If I am the recipient of the email, or in copy, I probably do not wish
     * to answer to myself; skip my email.
     */
    if (address.indexOf(gMyEmail) >= 0)
      continue;

    res.push("'" + address.replace(/'/g, "'\\''") + "'");
  }

  return res;
}
