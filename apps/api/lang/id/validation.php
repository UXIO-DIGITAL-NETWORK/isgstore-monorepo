<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Pesan Validasi
|--------------------------------------------------------------------------
|
| Berkas ini ada karena tanpanya bahasa sebuah pesan error bergantung pada
| endpoint mana yang kebetulan dipanggil: dua belas FormRequest menimpa
| `messages()` dengan bahasa Indonesia, sementara sekitar seratus lima puluh
| sisanya jatuh ke bawaan Laravel yang berbahasa Inggris. Satu formulir bisa
| menampilkan dua bahasa sekaligus.
|
| Menyetel `APP_LOCALE=id` tanpa berkas ini justru memperburuk keadaan —
| terjemahannya hilang dan semuanya kembali ke Inggris. Keduanya harus
| berubah bersamaan.
|
| `:attribute` diisi dari blok `attributes` di bawah bila ada, atau dari nama
| kolomnya dengan garis bawah diganti spasi.
|
*/

return [
    'accepted' => ':attribute harus disetujui.',
    'accepted_if' => ':attribute harus disetujui bila :other bernilai :value.',
    'active_url' => ':attribute bukan URL yang valid.',
    'after' => ':attribute harus berisi tanggal setelah :date.',
    'after_or_equal' => ':attribute harus berisi tanggal setelah atau sama dengan :date.',
    'alpha' => ':attribute hanya boleh berisi huruf.',
    'alpha_dash' => ':attribute hanya boleh berisi huruf, angka, tanda hubung, dan garis bawah.',
    'alpha_num' => ':attribute hanya boleh berisi huruf dan angka.',
    'any_of' => ':attribute tidak valid.',
    'array' => ':attribute harus berupa larik.',
    'ascii' => ':attribute hanya boleh berisi karakter dan simbol alfanumerik satu bita.',
    'before' => ':attribute harus berisi tanggal sebelum :date.',
    'before_or_equal' => ':attribute harus berisi tanggal sebelum atau sama dengan :date.',
    'between' => [
        'array' => ':attribute harus berisi antara :min sampai :max item.',
        'file' => ':attribute harus berukuran antara :min sampai :max kilobita.',
        'numeric' => ':attribute harus bernilai antara :min sampai :max.',
        'string' => ':attribute harus berisi antara :min sampai :max karakter.',
    ],
    'boolean' => ':attribute harus bernilai benar atau salah.',
    'can' => ':attribute berisi nilai yang tidak diizinkan.',
    'confirmed' => 'Konfirmasi :attribute tidak cocok.',
    'contains' => ':attribute tidak memuat nilai yang diwajibkan.',
    'current_password' => 'Password salah.',
    'date' => ':attribute bukan tanggal yang valid.',
    'date_equals' => ':attribute harus berisi tanggal yang sama dengan :date.',
    'date_format' => ':attribute tidak cocok dengan format :format.',
    'decimal' => ':attribute harus memiliki :decimal angka desimal.',
    'declined' => ':attribute harus ditolak.',
    'declined_if' => ':attribute harus ditolak bila :other bernilai :value.',
    'different' => ':attribute dan :other harus berbeda.',
    'digits' => ':attribute harus terdiri dari :digits angka.',
    'digits_between' => ':attribute harus terdiri dari :min sampai :max angka.',
    'dimensions' => ':attribute memiliki dimensi gambar yang tidak sesuai.',
    'distinct' => ':attribute memiliki nilai yang duplikat.',
    'doesnt_contain' => ':attribute tidak boleh memuat nilai tersebut.',
    'doesnt_end_with' => ':attribute tidak boleh diakhiri dengan salah satu dari: :values.',
    'doesnt_start_with' => ':attribute tidak boleh diawali dengan salah satu dari: :values.',
    'email' => ':attribute harus berupa alamat email yang valid.',
    'encoding' => ':attribute harus memakai pengodean :encoding.',
    'ends_with' => ':attribute harus diakhiri dengan salah satu dari: :values.',
    'enum' => ':attribute yang dipilih tidak valid.',
    'exists' => ':attribute yang dipilih tidak valid.',
    'extensions' => ':attribute harus memiliki salah satu ekstensi berikut: :values.',
    'file' => ':attribute harus berupa berkas.',
    'filled' => ':attribute wajib diisi.',
    'gt' => [
        'array' => ':attribute harus berisi lebih dari :value item.',
        'file' => ':attribute harus lebih besar dari :value kilobita.',
        'numeric' => ':attribute harus lebih besar dari :value.',
        'string' => ':attribute harus lebih panjang dari :value karakter.',
    ],
    'gte' => [
        'array' => ':attribute harus berisi :value item atau lebih.',
        'file' => ':attribute harus lebih besar dari atau sama dengan :value kilobita.',
        'numeric' => ':attribute harus lebih besar dari atau sama dengan :value.',
        'string' => ':attribute harus minimal :value karakter.',
    ],
    'hex_color' => ':attribute harus berupa warna heksadesimal yang valid.',
    'image' => ':attribute harus berupa gambar.',
    'in' => ':attribute yang dipilih tidak valid.',
    'in_array' => ':attribute tidak ada di dalam :other.',
    'in_array_keys' => ':attribute harus memuat setidaknya satu dari kunci berikut: :values.',
    'integer' => ':attribute harus berupa bilangan bulat.',
    'ip' => ':attribute harus berupa alamat IP yang valid.',
    'ipv4' => ':attribute harus berupa alamat IPv4 yang valid.',
    'ipv6' => ':attribute harus berupa alamat IPv6 yang valid.',
    'json' => ':attribute harus berupa JSON yang valid.',
    'list' => ':attribute harus berupa daftar.',
    'lowercase' => ':attribute harus berupa huruf kecil.',
    'lt' => [
        'array' => ':attribute harus berisi kurang dari :value item.',
        'file' => ':attribute harus lebih kecil dari :value kilobita.',
        'numeric' => ':attribute harus lebih kecil dari :value.',
        'string' => ':attribute harus lebih pendek dari :value karakter.',
    ],
    'lte' => [
        'array' => ':attribute tidak boleh lebih dari :value item.',
        'file' => ':attribute harus lebih kecil dari atau sama dengan :value kilobita.',
        'numeric' => ':attribute harus lebih kecil dari atau sama dengan :value.',
        'string' => ':attribute tidak boleh lebih dari :value karakter.',
    ],
    'mac_address' => ':attribute harus berupa alamat MAC yang valid.',
    'max' => [
        'array' => ':attribute tidak boleh berisi lebih dari :max item.',
        'file' => ':attribute tidak boleh lebih dari :max kilobita.',
        'numeric' => ':attribute tidak boleh lebih dari :max.',
        'string' => ':attribute tidak boleh lebih dari :max karakter.',
    ],
    'max_digits' => ':attribute tidak boleh lebih dari :max angka.',
    'mimes' => ':attribute harus berupa berkas bertipe: :values.',
    'mimetypes' => ':attribute harus berupa berkas bertipe: :values.',
    'min' => [
        'array' => ':attribute harus berisi minimal :min item.',
        'file' => ':attribute harus berukuran minimal :min kilobita.',
        'numeric' => ':attribute harus bernilai minimal :min.',
        'string' => ':attribute harus berisi minimal :min karakter.',
    ],
    'min_digits' => ':attribute harus terdiri dari minimal :min angka.',
    'missing' => ':attribute harus kosong.',
    'missing_if' => ':attribute harus kosong bila :other bernilai :value.',
    'missing_unless' => ':attribute harus kosong kecuali :other bernilai :value.',
    'missing_with' => ':attribute harus kosong bila :values ada.',
    'missing_with_all' => ':attribute harus kosong bila semua :values ada.',
    'multiple_of' => ':attribute harus merupakan kelipatan dari :value.',
    'not_in' => ':attribute yang dipilih tidak valid.',
    'not_regex' => 'Format :attribute tidak valid.',
    'numeric' => ':attribute harus berupa angka.',
    'password' => [
        'letters' => ':attribute harus memuat setidaknya satu huruf.',
        'mixed' => ':attribute harus memuat setidaknya satu huruf besar dan satu huruf kecil.',
        'numbers' => ':attribute harus memuat setidaknya satu angka.',
        'symbols' => ':attribute harus memuat setidaknya satu simbol.',
        'uncompromised' => ':attribute pernah bocor dalam kebocoran data. Silakan pilih yang lain.',
    ],
    'present' => ':attribute harus ada.',
    'present_if' => ':attribute harus ada bila :other bernilai :value.',
    'present_unless' => ':attribute harus ada kecuali :other bernilai :value.',
    'present_with' => ':attribute harus ada bila :values ada.',
    'present_with_all' => ':attribute harus ada bila semua :values ada.',
    'prohibited' => ':attribute tidak diizinkan.',
    'prohibited_if' => ':attribute tidak diizinkan bila :other bernilai :value.',
    'prohibited_if_accepted' => ':attribute tidak diizinkan bila :other disetujui.',
    'prohibited_if_declined' => ':attribute tidak diizinkan bila :other ditolak.',
    'prohibited_unless' => ':attribute tidak diizinkan kecuali :other ada di dalam :values.',
    'prohibits' => ':attribute membuat :other tidak diizinkan.',
    'regex' => 'Format :attribute tidak valid.',
    'required' => ':attribute wajib diisi.',
    'required_array_keys' => ':attribute harus memuat kunci berikut: :values.',
    'required_if' => ':attribute wajib diisi bila :other bernilai :value.',
    'required_if_accepted' => ':attribute wajib diisi bila :other disetujui.',
    'required_if_declined' => ':attribute wajib diisi bila :other ditolak.',
    'required_unless' => ':attribute wajib diisi kecuali :other ada di dalam :values.',
    'required_with' => ':attribute wajib diisi bila :values ada.',
    'required_with_all' => ':attribute wajib diisi bila semua :values ada.',
    'required_without' => ':attribute wajib diisi bila :values tidak ada.',
    'required_without_all' => ':attribute wajib diisi bila semua :values tidak ada.',
    'same' => ':attribute dan :other harus sama.',
    'size' => [
        'array' => ':attribute harus berisi :size item.',
        'file' => ':attribute harus berukuran :size kilobita.',
        'numeric' => ':attribute harus bernilai :size.',
        'string' => ':attribute harus berisi :size karakter.',
    ],
    'starts_with' => ':attribute harus diawali dengan salah satu dari: :values.',
    'string' => ':attribute harus berupa teks.',
    'timezone' => ':attribute harus berupa zona waktu yang valid.',
    'unique' => ':attribute sudah digunakan.',
    'uploaded' => ':attribute gagal diunggah.',
    'uppercase' => ':attribute harus berupa huruf besar.',
    'url' => ':attribute harus berupa URL yang valid.',
    'ulid' => ':attribute harus berupa ULID yang valid.',
    'uuid' => ':attribute harus berupa UUID yang valid.',

    /*
    |--------------------------------------------------------------------------
    | Pesan Validasi Khusus
    |--------------------------------------------------------------------------
    |
    | Untuk pasangan atribut/aturan tertentu. FormRequest yang sudah menimpa
    | `messages()` sendiri tetap menang atas apa pun di sini.
    |
    */

    'custom' => [
        'attribute-name' => [
            'rule-name' => 'pesan-khusus',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Nama Atribut
    |--------------------------------------------------------------------------
    |
    | Hanya untuk kolom yang nama teknisnya tidak enak dibaca pengguna. Sisanya
    | biarkan Laravel menurunkannya sendiri dari nama kolom.
    |
    */

    'attributes' => [
        'email' => 'Email',
        'password' => 'Password',
        'password_confirmation' => 'Konfirmasi password',
        'current_password' => 'Password saat ini',
        'name' => 'Nama',
        'username' => 'Username',
        'phone' => 'Nomor telepon',
        'guest_contact' => 'Nomor WhatsApp',
        'code' => 'Kode',
        'locale' => 'Bahasa',
        'timezone' => 'Zona waktu',
        'amount' => 'Jumlah',
        'price' => 'Harga',
        'cost_min' => 'Harga minimum',
        'cost_max' => 'Harga maksimum',
        'category_id' => 'Kategori',
        'product_id' => 'Produk',
        'invoice_number' => 'Nomor invoice',
    ],
];
