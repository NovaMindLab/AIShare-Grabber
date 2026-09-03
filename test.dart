import 'dart:typed_data'; void main() { final b = ByteData(4); b.setInt32(0, 1785465224948, Endian.big); print(b.getInt32(0, Endian.big)); }
