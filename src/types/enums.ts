export enum TypeDisposable {
  PLASTIC_PACKAGING = 'PLASTIC PACKAGING',
  CARDBOARD_PACKAGING = 'CARDBOARD PACKAGING',
  PAPER = 'PAPER',
  GLASS_PACKAGING = 'GLASS PACKAGING',
  METAL_PACKAGING = 'METAL PACKAGING',
  USED = 'USED',
  DAMAGED = 'DAMAGED',
  DISHES = 'DISHES',
  ORGANIC = 'ORGANIC',
  NOT_PACKAGING = 'NOT PACKAGING',
  MEDICINE = 'MEDICINE',
  TOXIC = 'TOXIC',
  DEVICE = 'DEVICE',
  TEXTILE = 'TEXTILE',
  BULKY_WASTE = 'BULKY WASTE',
}

export enum TypeBin {
  RED = 'rouge',
  YELLOW = 'jaune',
  BLUE = 'bleu',
  ORANGE = 'orange',
  COMPOST = 'compost',
}

export const keyToEnum = <T extends Record<string, string | number>>(
  enumType: T,
  key: keyof T
): T[keyof T] => {
  return enumType[key];
};
