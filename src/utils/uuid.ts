// src/utils/uuid.ts

export function generateUUID(): string {
    function random16Bit(): string {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
  
    return (
      random16Bit() +
      random16Bit() +
      "-" +
      random16Bit() +
      "-" +
      "4" +
      random16Bit().substring(0, 3) +
      "-" +
      (8 + (Math.random() * 4) | 0).toString(16) +
      random16Bit().substring(0, 3) +
      "-" +
      random16Bit() +
      random16Bit() +
      random16Bit()
    );
  }
  