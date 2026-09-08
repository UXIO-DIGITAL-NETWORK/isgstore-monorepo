<?php

namespace Database\Seeders;

use App\Models\Page;
use Illuminate\Database\Seeder;

/**
 * Static pages. The privacy policy carries the copy the storefront previously
 * read from its locale JSON; terms and refund policy are stubs for the two
 * footer links that currently point at "#".
 */
class PageSeeder extends Seeder
{
    public function run(): void
    {
        $pages = [
            [
                'slug' => 'kebijakan-privasi',
                'locale' => 'id',
                'title' => 'Kebijakan Privasi',
                'intro' => [
                    'Syarat dan ketentuan ini menguraikan aturan dan regulasi penggunaan Situs Web ISG Store, yang berlokasi di https://isgstore.id.',
                    'Dengan mengakses situs web ini kami menganggap Anda menerima syarat dan ketentuan ini. Jangan terus menggunakan ISG Store jika Anda tidak setuju untuk menerima semua syarat dan ketentuan yang dinyatakan di halaman ini.',
                    'Terminologi berikut berlaku untuk Syarat dan Ketentuan ini, Pernyataan Privasi dan Pemberitahuan Penolakan, serta semua Perjanjian: "Klien", "Anda", dan "milik Anda" merujuk pada Anda, orang yang masuk ke situs web ini dan mematuhi syarat dan ketentuan Perusahaan. "Perusahaan", "Diri Kami", "Kami", "milik Kami", dan "Kita", merujuk pada Perusahaan kami. "Pihak", "Para Pihak", atau "Kami", merujuk pada Klien dan diri kami sendiri. Semua istilah merujuk pada penawaran, penerimaan, dan pertimbangan pembayaran yang diperlukan untuk melakukan proses bantuan kepada Klien dengan cara yang paling sesuai demi tujuan memenuhi kebutuhan Klien sehubungan dengan penyediaan layanan Perusahaan yang dinyatakan, sesuai dengan dan tunduk pada hukum yang berlaku di Indonesia.',
                ],
                'sections' => [
                    [
                        'heading' => 'Cookies',
                        'paragraphs' => [
                            'Kami menggunakan Cookies. Dengan mengakses ISG Store, Anda setuju menggunakan Cookie sesuai dengan Kebijakan Privasi ISG Store.',
                            'Sebagian besar situs web interaktif menggunakan cookie untuk memungkinkan kami mengambil detail pengguna untuk setiap kunjungan. Cookie digunakan oleh situs web kami untuk mengaktifkan fungsionalitas area tertentu guna memudahkan orang-orang yang mengunjungi situs web kami. Beberapa afiliasi dan mitra iklan kami juga dapat menggunakan cookie.',
                            'Dengan mengakses ISG Store, Anda setuju menggunakan cookie sesuai dengan kebijakan privasi kami. Sebagian besar browser interaktif modern memungkinkan Anda mengatur cookie agar tidak disimpan, namun hal ini dapat memengaruhi cara kerja situs web.',
                        ],
                    ],
                    [
                        'heading' => 'Lisensi',
                        'paragraphs' => [
                            'Kecuali dinyatakan lain, ISG Store dan/atau pemberi lisensinya memiliki hak kekayaan intelektual untuk semua materi di ISG Store. Semua hak kekayaan intelektual dilindungi undang-undang. Anda dapat mengakses ini dari ISG Store untuk penggunaan pribadi Anda sendiri dengan tunduk pada batasan yang ditetapkan dalam syarat dan ketentuan ini.',
                            'Anda tidak boleh:',
                        ],
                        'bullets' => [
                            'Menerbitkan ulang materi dari ISG Store',
                            'Menjual, menyewakan, atau mensublisensikan materi dari ISG Store',
                            'Mereproduksi, menduplikasi, atau menyalin materi dari ISG Store',
                            'Mendistribusikan ulang konten dari ISG Store',
                        ],
                    ],
                    [
                        'heading' => 'Komentar',
                        'paragraphs' => [
                            'Bagian dari situs web ini menawarkan kesempatan bagi pengguna untuk memposting dan bertukar pendapat serta informasi di area tertentu situs web. ISG Store tidak memfilter, mengedit, menerbitkan, atau meninjau Komentar sebelum kehadirannya di situs web. Komentar tidak mencerminkan pandangan dan pendapat ISG Store, agen, dan/atau afiliasinya. Komentar mencerminkan pandangan dan pendapat orang yang memposting pandangan dan pendapatnya. Sejauh diizinkan oleh hukum yang berlaku, ISG Store tidak bertanggung jawab atas Komentar atau atas kewajiban, kerusakan, atau pengeluaran yang disebabkan dan/atau diderita akibat penggunaan dan/atau penerbitan dan/atau penampilan Komentar di situs web ini.',
                            'ISG Store berhak memantau semua Komentar dan menghapus Komentar yang dapat dianggap tidak pantas, menyinggung, atau menyebabkan pelanggaran Syarat dan Ketentuan ini.',
                            'Anda menjamin dan menyatakan bahwa:',
                        ],
                        'bullets' => [
                            'Anda berhak memposting Komentar di situs web kami dan memiliki semua lisensi dan persetujuan yang diperlukan untuk melakukannya',
                            'Komentar tidak melanggar hak kekayaan intelektual apa pun, termasuk namun tidak terbatas pada hak cipta, paten, atau merek dagang pihak ketiga mana pun',
                            'Komentar tidak mengandung materi yang mencemarkan nama baik, memfitnah, menyinggung, tidak senonoh, atau melanggar hukum yang merupakan pelanggaran privasi',
                            'Komentar tidak akan digunakan untuk mengajak atau mempromosikan bisnis atau aktivitas ilegal atau komersial',
                            'Dengan ini Anda memberikan kepada ISG Store lisensi non-eksklusif untuk menggunakan, mereproduksi, mengedit, dan mengizinkan orang lain untuk menggunakan, mereproduksi, dan mengedit Komentar Anda dalam segala bentuk, format, atau media',
                        ],
                    ],
                    [
                        'heading' => 'Hyperlink ke Konten Kami',
                        'paragraphs' => [
                            'Organisasi berikut dapat memberikan tautan ke Situs Web kami tanpa persetujuan tertulis sebelumnya.',
                            'Tautan ke Situs Web kami dapat dibuat oleh organisasi-organisasi ini dengan cara yang wajar, tidak menipu, tidak secara keliru menyiratkan sponsor, dukungan, atau persetujuan dari pihak yang menautkan dan produk serta layanannya, serta sesuai dengan konteks situs pihak yang menautkan.',
                            'Kami dapat mempertimbangkan dan menyetujui permintaan tautan lain dari jenis organisasi berikut:',
                        ],
                        'bullets' => [
                            'Lembaga pemerintah',
                            'Mesin pencari',
                            'Organisasi berita',
                            'Distributor direktori online dapat menautkan ke Situs Web kami dengan cara yang sama seperti mereka menautkan ke Situs Web bisnis lain yang terdaftar',
                            'Bisnis yang Diakreditasi Seluruh Sistem kecuali organisasi nirlaba, pusat perbelanjaan amal, dan kelompok penggalangan dana amal yang tidak dapat membuat hyperlink ke Situs Web kami',
                        ],
                    ],
                    [
                        'heading' => 'iFrames',
                        'paragraphs' => [
                            'Tanpa persetujuan sebelumnya dan izin tertulis, Anda tidak boleh membuat frame di sekitar halaman web kami yang mengubah presentasi visual atau tampilan Situs Web kami.',
                        ],
                    ],
                    [
                        'heading' => 'Tanggung Jawab Konten',
                        'paragraphs' => [
                            'Kami tidak bertanggung jawab atas konten apa pun yang muncul di Situs Web Anda. Anda setuju untuk melindungi dan membela kami terhadap semua klaim yang diajukan di Situs Web Anda. Tidak ada tautan yang boleh muncul di Situs Web mana pun yang dapat ditafsirkan sebagai memfitnah, tidak senonoh, atau kriminal, atau yang melanggar, jika tidak, melanggar atau mendukung pelanggaran atau pelanggaran lain dari hak pihak ketiga mana pun.',
                        ],
                    ],
                    [
                        'heading' => 'Hak Privasi Anda',
                        'paragraphs' => [
                            'Silakan baca Kebijakan Privasi kami.',
                            'ISG Store berkomitmen untuk melindungi privasi Anda. Informasi pribadi yang Anda berikan saat menggunakan layanan kami akan digunakan sesuai dengan kebijakan privasi kami dan tidak akan dijual, disewakan, atau dibagikan kepada pihak ketiga tanpa izin Anda, kecuali jika diwajibkan oleh hukum.',
                        ],
                    ],
                    [
                        'heading' => 'Penghapusan Tautan dari Situs Web Kami',
                        'paragraphs' => [
                            'Jika Anda menemukan tautan di Situs Web kami yang menyinggung karena alasan apa pun, Anda bebas untuk menghubungi dan memberi tahu kami kapan saja. Kami akan mempertimbangkan permintaan penghapusan tautan, namun kami tidak berkewajiban untuk merespons atau melakukannya secara langsung.',
                            'Kami tidak memastikan bahwa informasi di situs web ini benar, kami tidak menjamin kelengkapannya atau akurasinya; kami juga tidak berjanji untuk memastikan bahwa situs web tetap tersedia atau materi di situs web tetap diperbarui.',
                        ],
                    ],
                    [
                        'heading' => 'Penafian',
                        'paragraphs' => [
                            'Sejauh yang diizinkan oleh hukum yang berlaku, kami mengecualikan semua representasi, jaminan, dan kondisi yang berkaitan dengan situs web kami dan penggunaan situs web ini. Tidak ada dalam penafian ini yang akan:',
                            'Sejauh hukum mengizinkan kami untuk mengecualikan liabilitas untuk kematian atau cedera pribadi yang disebabkan oleh kelalaian kami atau kelalaian karyawan, agen, atau kontraktor kami; penipuan atau keliru dengan sengaja; atau liabilitas yang tidak dapat dikecualikan atau dibatasi berdasarkan hukum yang berlaku.',
                        ],
                        'bullets' => [
                            'Batasi atau kecualikan liabilitas kami atau Anda atas kematian atau cedera pribadi',
                            'Batasi atau kecualikan liabilitas kami atau Anda atas penipuan atau kesalahan representasi yang disengaja',
                            'Batasi liabilitas kami atau Anda dengan cara apa pun yang tidak diizinkan berdasarkan hukum yang berlaku',
                            'Kecualikan liabilitas kami atau Anda yang mungkin tidak dikecualikan berdasarkan hukum yang berlaku',
                        ],
                    ],
                ],
            ],
            [
                'slug' => 'kebijakan-privasi',
                'locale' => 'en',
                'title' => 'Privacy Policy',
                'intro' => [
                    'These terms and conditions outline the rules and regulations for the use of ISG Store\'s Website, located at https://isgstore.id.',
                    'By accessing this website we assume you accept these terms and conditions. Do not continue to use ISG Store if you do not agree to take all of the terms and conditions stated on this page.',
                    'The following terminology applies to these Terms and Conditions, Privacy Statement and Disclaimer Notice and all Agreements: "Client", "You" and "Your" refers to you, the person logging on this website and compliant to the Company\'s terms and conditions. "The Company", "Ourselves", "We", "Our" and "Us", refers to our Company. "Party", "Parties", or "Us", refers to both the Client and ourselves. All terms refer to the offer, acceptance and consideration of payment necessary to undertake the process of our assistance to the Client in the most appropriate manner for the express purpose of meeting the Client\'s needs in respect of provision of the Company\'s stated services, in accordance with and subject to the prevailing law of Indonesia.',
                ],
                'sections' => [
                    [
                        'heading' => 'Cookies',
                        'paragraphs' => [
                            'We employ the use of cookies. By accessing ISG Store, you agreed to use cookies in agreement with ISG Store\'s Privacy Policy.',
                            'Most interactive websites use cookies to let us retrieve the user\'s details for each visit. Cookies are used by our website to enable the functionality of certain areas to make it easier for people visiting our website. Some of our affiliate and advertising partners may also use cookies.',
                            'By accessing ISG Store, you agreed to use cookies in agreement with our privacy policy. Most modern interactive web browsers allow you to set cookies not to be stored, however this may affect how the website works.',
                        ],
                    ],
                    [
                        'heading' => 'License',
                        'paragraphs' => [
                            'Unless otherwise stated, ISG Store and/or its licensors own the intellectual property rights for all material on ISG Store. All intellectual property rights are reserved. You may access this from ISG Store for your own personal use subjected to restrictions set in these terms and conditions.',
                            'You must not:',
                        ],
                        'bullets' => [
                            'Republish material from ISG Store',
                            'Sell, rent or sub-license material from ISG Store',
                            'Reproduce, duplicate or copy material from ISG Store',
                            'Redistribute content from ISG Store',
                        ],
                    ],
                    [
                        'heading' => 'Comments',
                        'paragraphs' => [
                            'Parts of this website offer an opportunity for users to post and exchange opinions and information in certain areas of the website. ISG Store does not filter, edit, publish or review Comments prior to their presence on the website. Comments do not reflect the views and opinions of ISG Store, its agents and/or affiliates. Comments reflect the views and opinions of the person who posts their views and opinions. To the extent permitted by applicable laws, ISG Store shall not be liable for the Comments or for any liability, damages or expenses caused and/or suffered as a result of any use of and/or posting of and/or appearance of the Comments on this website.',
                            'ISG Store reserves the right to monitor all Comments and to remove any Comments which can be considered inappropriate, offensive or causes breach of these Terms and Conditions.',
                            'You warrant and represent that:',
                        ],
                        'bullets' => [
                            'You are entitled to post the Comments on our website and have all necessary licenses and consents to do so',
                            'The Comments do not invade any intellectual property right, including without limitation copyright, patent or trademark of any third party',
                            'The Comments do not contain any defamatory, libellous, offensive, indecent or otherwise unlawful material which is an invasion of privacy',
                            'The Comments will not be used to solicit or promote business or custom or present commercial activities or unlawful activity',
                            'You hereby grant ISG Store a non-exclusive license to use, reproduce, edit and authorize others to use, reproduce and edit any of your Comments in any and all forms, formats or media',
                        ],
                    ],
                    [
                        'heading' => 'Hyperlinking to our Content',
                        'paragraphs' => [
                            'The following organizations may link to our Website without prior written approval.',
                            'Links to our Website may be made by these organizations in a way that is fair and legal, does not deceptively imply sponsorship, endorsement or approval of the linking party and its products and/or services, and is within the context of the linking party\'s site.',
                            'We may consider and approve other link requests from the following types of organizations:',
                        ],
                        'bullets' => [
                            'Government agencies',
                            'Search engines',
                            'News organizations',
                            'Online directory distributors may link to our Website in the same manner as they hyperlink to the Websites of other listed businesses',
                            'System wide Accredited Businesses except soliciting non-profit organizations, charity shopping malls, and charity fundraising groups which may not hyperlink to our Website',
                        ],
                    ],
                    [
                        'heading' => 'iFrames',
                        'paragraphs' => [
                            'Without prior approval and written permission, you may not create frames around our web pages that alter in any way the visual presentation or appearance of our Website.',
                        ],
                    ],
                    [
                        'heading' => 'Content Liability',
                        'paragraphs' => [
                            'We shall not be held responsible for any content that appears on your Website. You agree to protect and defend us against all claims that are rising on your Website. No link(s) should appear on any Website that may be interpreted as libellous, obscene or criminal, or which infringes, otherwise violates, or advocates the infringement or other violation of, any third party rights.',
                        ],
                    ],
                    [
                        'heading' => 'Your Privacy',
                        'paragraphs' => [
                            'Please read our Privacy Policy.',
                            'ISG Store is committed to protecting your privacy. Personal information you provide when using our services will be used in accordance with our privacy policy and will not be sold, rented, or shared with third parties without your permission, except as required by law.',
                        ],
                    ],
                    [
                        'heading' => 'Reservation of Rights',
                        'paragraphs' => [
                            'We reserve the right to request that you remove all links or any particular link to our Website. You approve to immediately remove all links to our Website upon request. We also reserve the right to amend these terms and conditions and its linking policy at any time. By continuously linking to our Website, you agree to be bound to and follow these linking terms and conditions.',
                            'If you find any link on our Website that is offensive for any reason, you are free to contact and inform us at any time. We will consider requests to remove links, but we are not obligated to do so or to respond to you directly.',
                        ],
                    ],
                    [
                        'heading' => 'Disclaimer',
                        'paragraphs' => [
                            'To the maximum extent permitted by applicable law, we exclude all representations, warranties and conditions relating to our website and the use of this website. Nothing in this disclaimer will:',
                            'To the extent that the law permits us to exclude liability for death or personal injury caused by our negligence or the negligence of our employees, agents or contractors; fraud or fraudulent misrepresentation; or liability which may not be excluded or limited under applicable law.',
                        ],
                        'bullets' => [
                            'Limit or exclude our or your liability for death or personal injury',
                            'Limit or exclude our or your liability for fraud or fraudulent misrepresentation',
                            'Limit any of our or your liabilities in any way that is not permitted under applicable law',
                            'Exclude any of our or your liabilities that may not be excluded under applicable law',
                        ],
                    ],
                ],
            ],
        ];

        foreach ($pages as $page) {
            Page::updateOrCreate(
                ['slug' => $page['slug'], 'locale' => $page['locale']],
                [
                    'title' => $page['title'],
                    'intro' => $page['intro'],
                    'sections' => $page['sections'],
                    'is_published' => true,
                    'meta_title' => $page['title'],
                    'meta_robots' => 'noindex,follow',
                ],
            );
        }

        // Placeholders so the footer's Terms and Refund links resolve to a real
        // page instead of "#". Content is deliberately short — the legal text
        // is the business's to write, not something to invent here.
        $stubs = [
            ['slug' => 'syarat-ketentuan', 'title' => 'Syarat & Ketentuan'],
            ['slug' => 'kebijakan-refund', 'title' => 'Kebijakan Refund'],
        ];

        foreach ($stubs as $stub) {
            Page::updateOrCreate(
                ['slug' => $stub['slug'], 'locale' => 'id'],
                [
                    'title' => $stub['title'],
                    'intro' => ['Halaman ini sedang disusun. Hubungi tim support untuk informasi lebih lanjut.'],
                    'sections' => [],
                    'is_published' => true,
                    'meta_title' => $stub['title'],
                    'meta_robots' => 'noindex,follow',
                ],
            );
        }
    }
}
