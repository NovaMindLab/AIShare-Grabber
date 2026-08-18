const fs = require('fs');
let pubspec = fs.readFileSync('android/pubspec.yaml', 'utf8');

pubspec = pubspec.replace('file_picker: any', 'file_picker: ^11.0.2\n  device_info_plus: ^12.4.0');

fs.writeFileSync('android/pubspec.yaml', pubspec, 'utf8');
console.log('Fixed pubspec.yaml with ^11.0.2 and ^12.4.0');
