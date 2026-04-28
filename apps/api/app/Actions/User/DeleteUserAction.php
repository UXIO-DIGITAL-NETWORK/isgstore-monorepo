<?php

namespace App\Actions\User;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\HttpException;

class DeleteUserAction
{
    /**
     * Mengeksekusi proses penghapusan user dengan proteksi keamanan.
     *
     * @param User $user
     * @return bool
     * @throws HttpException
     */
    public function execute(User $user): bool
    {
        // 1. Constraint: Mencegah user menghapus dirinya sendiri
        if (Auth::id() === $user->id) {
            abort(403, 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
        }

        // 2. Constraint: Mencegah penghapusan Admin
        // Melindungi User dengan ID 1 (Super Admin pertama) atau siapapun yang memiliki Role ID 1 (Admin)
        if ($user->id === 1 || $user->role_id === 1) {
            abort(403, 'Akun Administrator tidak boleh dihapus dari sistem untuk alasan keamanan.');
        }

        return $user->delete();
    }
}
