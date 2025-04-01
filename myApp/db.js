import SQLite from "react-native-sqlite-storage";
import * as FileSystem from "react-native-fs";
import DocumentPicker from "react-native-document-picker";
import { parse } from "papaparse";
import axios from "axios";

const db = SQLite.openDatabase({ name: 'app.db', location: 'default' });

const websiteAPIsync = "https://yourwebsite.com/api/sync.php";

export const syncWithServer = async () => {
  db.transaction((tx) => {
    tx.executeSql("SELECT * FROM values WHERE scanned = 1;", [], (_, { rows }) => {
      const scannedData = rows.raw();
      axios.post(websiteAPIsync, scannedData)
        .then(() => alert("Synced with server!"))
        .catch((err) => console.error(err));
    });
  });
};

export const importCSV = async () => {
  try {
    const result = await DocumentPicker.pick({
      type: [DocumentPicker.types.csv],
    });

    const fileContent = await FileSystem.readFile(result.uri, 'utf8');
    const parsedData = parse(fileContent, { header: true });

    parsedData.data.forEach((row) => {
      db.transaction((tx) => {
        tx.executeSql(
          "INSERT INTO values (qr_code, scanned) VALUES (?, 0);",
          [row.qr_code]
        );
      });
    });

    alert("CSV Imported!");
  } catch (err) {
    if (DocumentPicker.isCancel(err)) {
      console.log('User cancelled the picker');
    } else {
      throw err;
    }
  }
};

export const setupDatabase = async () => {
  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS values (id INTEGER PRIMARY KEY AUTOINCREMENT, qr_code TEXT UNIQUE, scanned INTEGER DEFAULT 0);',
          [],
          (_, result) => {
            console.log('Table created successfully');
            resolve(result);
          },
          (_, error) => {
            console.error('Error creating table:', error);
            reject(error);
            return false;
          }
        );
      });
    } catch (error) {
      console.error('Database transaction failed:', error);
      reject(error);
    }
  });
};

export const insertValue = (qrCode) => {
  db.transaction((tx) => {
    tx.executeSql(
      "INSERT INTO values (qr_code, scanned) VALUES (?, 0);",
      [qrCode]
    );
  });
};

export const markAsScanned = (qrCode) => {
  db.transaction(tx => {
    tx.executeSql('UPDATE values SET scanned = 1 WHERE qr_code = ?', [qrCode]);
  });
};

export const checkIfExists = (qrCode, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      'SELECT * FROM values WHERE qr_code = ?',
      [qrCode],
      (_, { rows }) => callback(rows.raw()[0])
    );
  });
};