<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Category;

class SubCategorySeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $subs = [];

        // MLBB (id 1)
        foreach (['Diamond','Weekly Diamond Pass','Starlight','Twilight Pass'] as $name) {
            $subs[] = ['category_id'=>1,'name'=>$name,'logo'=>null,'status'=>true,'created_at'=>$now,'updated_at'=>$now];
        }
        // Genshin (id 2)
        foreach (['Genesis Crystal','Blessing of the Welkin Moon','Battle Pass'] as $name) {
            $subs[] = ['category_id'=>2,'name'=>$name,'logo'=>null,'status'=>true,'created_at'=>$now,'updated_at'=>$now];
        }
        // Free Fire (id 3)
        foreach (['Diamond','Membership','Elite Pass'] as $name) {
            $subs[] = ['category_id'=>3,'name'=>$name,'logo'=>null,'status'=>true,'created_at'=>$now,'updated_at'=>$now];
        }
        // PUBG Mobile (id 4)
        foreach (['UC','Royale Pass','Prime Plus'] as $name) {
            $subs[] = ['category_id'=>4,'name'=>$name,'logo'=>null,'status'=>true,'created_at'=>$now,'updated_at'=>$now];
        }
        // Valorant (id 9)
        foreach (['Valorant Points','Night Market'] as $name) {
            $subs[] = ['category_id'=>9,'name'=>$name,'logo'=>null,'status'=>true,'created_at'=>$now,'updated_at'=>$now];
        }
        // Steam (id 10)
        foreach (['Wallet IDR 12.000','Wallet IDR 45.000','Wallet IDR 60.000','Wallet IDR 90.000','Wallet IDR 120.000','Wallet IDR 250.000'] as $name) {
            $subs[] = ['category_id'=>10,'name'=>$name,'logo'=>null,'status'=>true,'created_at'=>$now,'updated_at'=>$now];
        }
        // HSR (id 5)
        foreach (['Oneiric Shard','Express Supply Pass'] as $name) {
            $subs[] = ['category_id'=>5,'name'=>$name,'logo'=>null,'status'=>true,'created_at'=>$now,'updated_at'=>$now];
        }
        // Google Play (id 16)
        foreach (['Rp 20.000','Rp 50.000','Rp 100.000','Rp 150.000','Rp 300.000','Rp 500.000'] as $name) {
            $subs[] = ['category_id'=>16,'name'=>$name,'logo'=>null,'status'=>true,'created_at'=>$now,'updated_at'=>$now];
        }

        DB::table('sub_categories')->insert($subs);
    }
}
