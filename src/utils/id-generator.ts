import { ID_SIZE } from "./constant";

export function getRandomId() {
  const a = Math.random() * Math.pow(10, ID_SIZE);
  return Math.floor(a);
}
