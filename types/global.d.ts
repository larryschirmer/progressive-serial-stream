export {};

declare global {
  type PortProperties = {
    baudRate: number;
    bufferSize: number;
    dataBits: number;
    flowControl: number;
    parity: string;
    stopBits: number;
  };

  type SerialPort = {
    readable: ReadableStream;
    writable: WritableStream;
    getInfo: () => Promise<PortProperties>;
    open: (PortProperties) => Promise<void>;
    close: () => Promise<void>;
  };

  interface Navigator {
    serial: {
      requestPort: () => Promise<SerialPort>;
      getPorts: () => Promise<SerialPort[]>;
    };
  }
}
