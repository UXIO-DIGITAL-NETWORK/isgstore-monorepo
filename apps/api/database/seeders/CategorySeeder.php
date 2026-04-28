<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $categories = [
            // Mobile Games (type_id = 1)
            ['type_id'=>1,'name'=>'Mobile Legends: Bang Bang','code'=>'mlbb','validasi_nickname'=>'https://api.uxio.id/validate/mlbb','region'=>'ID','logo'=>'/logos/mlbb.png','description'=>'Top up Diamond Mobile Legends dengan harga termurah.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            ['type_id'=>1,'name'=>'Genshin Impact','code'=>'genshin','validasi_nickname'=>null,'region'=>'Asia','logo'=>'/logos/genshin.png','description'=>'Top up Genesis Crystal dan Welkin Moon.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            ['type_id'=>1,'name'=>'Free Fire','code'=>'freefire','validasi_nickname'=>'https://api.uxio.id/validate/ff','region'=>'ID','logo'=>'/logos/ff.png','description'=>'Top up Diamond Free Fire instant.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            ['type_id'=>1,'name'=>'PUBG Mobile','code'=>'pubgm','validasi_nickname'=>null,'region'=>'Global','logo'=>'/logos/pubgm.png','description'=>'Top up UC PUBG Mobile harga terjangkau.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            ['type_id'=>1,'name'=>'Honkai: Star Rail','code'=>'hsr','validasi_nickname'=>null,'region'=>'Asia','logo'=>'/logos/hsr.png','description'=>'Top up Oneiric Shard HSR.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            ['type_id'=>1,'name'=>'Arena of Valor','code'=>'aov','validasi_nickname'=>'https://api.uxio.id/validate/aov','region'=>'ID','logo'=>'/logos/aov.png','description'=>'Top up Voucher Arena of Valor.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            ['type_id'=>1,'name'=>'Clash of Clans','code'=>'coc','validasi_nickname'=>null,'region'=>'Global','logo'=>'/logos/coc.png','description'=>'Top up Gems Clash of Clans.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            ['type_id'=>1,'name'=>'Stumble Guys','code'=>'stumble','validasi_nickname'=>null,'region'=>'Global','logo'=>'/logos/stumble.png','description'=>'Top up Gems Stumble Guys.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            // PC Games (type_id = 2)
            ['type_id'=>2,'name'=>'Valorant','code'=>'valorant','validasi_nickname'=>null,'region'=>'AP','logo'=>'/logos/valorant.png','description'=>'Top up Valorant Points.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            ['type_id'=>2,'name'=>'Steam Wallet','code'=>'steam','validasi_nickname'=>null,'region'=>'IDR','logo'=>'/logos/steam.png','description'=>'Beli Steam Wallet Code IDR.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            ['type_id'=>2,'name'=>'League of Legends: Wild Rift','code'=>'lol-wr','validasi_nickname'=>null,'region'=>'SEA','logo'=>'/logos/lol.png','description'=>'Top up Wild Cores.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            ['type_id'=>2,'name'=>'Roblox','code'=>'roblox','validasi_nickname'=>null,'region'=>'Global','logo'=>'/logos/roblox.png','description'=>'Top up Robux Roblox.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            // Console (type_id = 3)
            ['type_id'=>3,'name'=>'PlayStation Store','code'=>'psn','validasi_nickname'=>null,'region'=>'ID','logo'=>'/logos/psn.png','description'=>'Beli PlayStation Store Wallet.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            ['type_id'=>3,'name'=>'Xbox Game Pass','code'=>'xbox','validasi_nickname'=>null,'region'=>'Global','logo'=>'/logos/xbox.png','description'=>'Beli Xbox Game Pass & Wallet.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            ['type_id'=>3,'name'=>'Nintendo eShop','code'=>'nintendo','validasi_nickname'=>null,'region'=>'US','logo'=>'/logos/nintendo.png','description'=>'Beli Nintendo eShop Card.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            // Voucher (type_id = 4)
            ['type_id'=>4,'name'=>'Google Play','code'=>'google-play','validasi_nickname'=>null,'region'=>'ID','logo'=>'/logos/gplay.png','description'=>'Beli voucher Google Play.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            ['type_id'=>4,'name'=>'Apple iTunes','code'=>'itunes','validasi_nickname'=>null,'region'=>'ID','logo'=>'/logos/apple.png','description'=>'Beli voucher Apple/iTunes Gift Card.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            ['type_id'=>4,'name'=>'Netflix','code'=>'netflix','validasi_nickname'=>null,'region'=>'ID','logo'=>'/logos/netflix.png','description'=>'Beli voucher Netflix Premium.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            ['type_id'=>4,'name'=>'Spotify','code'=>'spotify','validasi_nickname'=>null,'region'=>'ID','logo'=>'/logos/spotify.png','description'=>'Beli voucher Spotify Premium.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            // E-Wallet (type_id = 5)
            ['type_id'=>5,'name'=>'OVO','code'=>'ovo','validasi_nickname'=>null,'region'=>'ID','logo'=>'/logos/ovo.png','description'=>'Top up saldo OVO.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            ['type_id'=>5,'name'=>'GoPay','code'=>'gopay','validasi_nickname'=>null,'region'=>'ID','logo'=>'/logos/gopay.png','description'=>'Top up saldo GoPay.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            ['type_id'=>5,'name'=>'DANA','code'=>'dana','validasi_nickname'=>null,'region'=>'ID','logo'=>'/logos/dana.png','description'=>'Top up saldo DANA.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            ['type_id'=>5,'name'=>'ShopeePay','code'=>'shopeepay','validasi_nickname'=>null,'region'=>'ID','logo'=>'/logos/shopeepay.png','description'=>'Top up saldo ShopeePay.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            ['type_id'=>5,'name'=>'LinkAja','code'=>'linkaja','validasi_nickname'=>null,'region'=>'ID','logo'=>'/logos/linkaja.png','description'=>'Top up saldo LinkAja.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
            ['type_id'=>5,'name'=>'Telkomsel Pulsa','code'=>'tsel','validasi_nickname'=>null,'region'=>'ID','logo'=>'/logos/tsel.png','description'=>'Isi pulsa Telkomsel.','status'=>true,'created_at'=>$now,'updated_at'=>$now],
        ];

        DB::table('categories')->insert($categories);
    }
}
