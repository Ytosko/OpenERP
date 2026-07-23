// ESC/POS Commands & WebSerial / WebUSB Direct Hardware Thermal Printer Driver

export async function openCashDrawer(): Promise<boolean> {
  const ESC_POS_OPEN_DRAWER = new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);

  try {
    if ('serial' in navigator) {
      // @ts-ignore
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      const writer = port.writable.getWriter();
      await writer.write(ESC_POS_OPEN_DRAWER);
      writer.releaseLock();
      await port.close();
      return true;
    }
  } catch (err) {
    console.warn('WebSerial drawer open error or cancelled:', err);
  }

  return false;
}

export async function printDirectESC_POS(receiptText: string): Promise<boolean> {
  // ESC/POS Initialization & Text Commands
  const encoder = new TextEncoder();
  const ESC_INIT = new Uint8Array([0x1b, 0x40]); // ESC @ Init
  const ESC_ALIGN_CENTER = new Uint8Array([0x1b, 0x61, 0x01]);
  const ESC_CUT_PAPER = new Uint8Array([0x1d, 0x56, 0x41, 0x03]); // GS V Full Cut

  try {
    if ('serial' in navigator) {
      // @ts-ignore
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      const writer = port.writable.getWriter();
      
      await writer.write(ESC_INIT);
      await writer.write(ESC_ALIGN_CENTER);
      await writer.write(encoder.encode(receiptText));
      await writer.write(ESC_CUT_PAPER);
      
      writer.releaseLock();
      await port.close();
      return true;
    }
  } catch (err) {
    console.warn('WebSerial direct ESC/POS print error:', err);
  }

  // Fallback to browser print if hardware port not connected
  window.print();
  return true;
}
