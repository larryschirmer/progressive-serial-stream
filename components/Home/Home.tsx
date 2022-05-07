import { useEffect, useState } from 'react';

import styles from './Home.module.scss';

type Stream = {
  reader: ReadableStreamDefaultReader<string>;
  streamCallback: Promise<void>;
};

const Home = () => {
  const [isReading, setIsReading] = useState<NodeJS.Timer | null>(null);
  const [selectedPort, setSelectedPort] = useState<SerialPort | null>(null);
  const [stream, setStream] = useState<Stream | null>(null);
  const [data, setData] = useState<string>('');

  const setUpReader = (port: SerialPort) => {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    setStream({ reader, streamCallback: readableStreamClosed });
  };

  const stopReading = async () => {
    if (!stream || !selectedPort) return;
    if (isReading) clearInterval(isReading);
    setIsReading(null);
    setSelectedPort(null);
    stream.reader.cancel();
  };

  const getPort = async () => {
    if ('serial' in navigator) {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      setSelectedPort(port);
      setUpReader(port);
    } else {
      console.log('No serial ports available');
    }
  };

  const closePorts = async () => {
    if ('serial' in navigator) {
      const ports = await navigator.serial.getPorts();
      await Promise.all(
        ports.map(async (port) => {
          console.log('Closing port', { port });
          try {
            await port.close();
          } catch (e) {}
        }),
      );
    }
  };

  const readData = async () => {
    if (!stream || !selectedPort) return;
    const { reader, streamCallback } = stream;

    const cleanup = async () => {
      reader.releaseLock();
      await streamCallback.catch(() => {
        /* Ignore the error */
      });
    };

    // Listen to data coming from the serial device.
    try {
      const loop = setInterval(async () => {
        const { value, done } = await reader.read();
        if (done) cleanup();
        // value is a string.
        if (!!value) setData((d) => d + value);
      }, 500);
      setIsReading(loop);
    } catch (error) {
      cleanup();
    }
  };

  // print all available ports on load
  useEffect(() => {
    return () => {
      closePorts();
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button onClick={getPort} disabled={!!selectedPort}>
          Get Port
        </button>
        <button onClick={readData} disabled={!!isReading || !selectedPort}>
          Read Data
        </button>
        <button onClick={stopReading} disabled={!isReading}>
          Stop Reading
        </button>
      </div>
      <div className={styles.output}>{data}</div>
    </div>
  );
};

export default Home;
