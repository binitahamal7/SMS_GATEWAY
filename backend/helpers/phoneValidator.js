//number must be string
export function phoneValidator(num) {
  num = num.trim();

  if (num.length !== 10) {
    num = num.replace(/^\+?977/, "");
  }

  if (!/^(97|98)\d{8}$/.test(num)) {
    return false;
  }
  return num;
}
