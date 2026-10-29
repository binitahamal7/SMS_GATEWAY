const gsmRegex =
  /^[A-Za-z0-9@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà]*$/;

//finds which encoding does the message has
export function findEncoding(message) {
  return gsmRegex.test(message) ? "GSM-7" : "Unicode";
}

export function findCost(message) {
  const endoding = findEncoding(message); // "GSM-7" or "Unicode"
  const length = message.length; //length of a message ie 100

  //GSM-7
  // 1 SMS = 160 characters
  if (endoding === "GSM-7") {
    if (length <= 160) {
      return 1;
    }
    return Math.ceil(length / 153);
  } else {
    //Unicode
    //1 SMS = 70 characters
    if (length <= 70) {
      return 1;
    }
    return Math.ceil(length / 67);
  }
}
