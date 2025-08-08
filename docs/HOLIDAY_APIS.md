# API Hari Libur Indonesia

## Implementasi Saat Ini

Saat ini, sistem menggunakan data hari libur yang telah diprogramkan secara manual dalam `HolidayController`. Data ini sudah mencakup hari libur nasional untuk tahun 2025.

## API Eksternal yang Bisa Digunakan

### 1. **Kalenderindonesia.com API**

- URL: `https://api.kalenderindonesia.com/api/holidays`
- Gratis untuk penggunaan non-komersial
- Format: JSON
- Contoh: `https://api.kalenderindonesia.com/api/holidays/2025`

### 2. **Harilibur.id API**

- URL: `https://api.harilibur.id/v1/holidays`
- Gratis dengan rate limit
- Format: JSON
- Contoh: `https://api.harilibur.id/v1/holidays?year=2025`

### 3. **Nager.Date API (International)**

- URL: `https://date.nager.at/api/v3/publicholidays/{year}/ID`
- Gratis
- Mendukung Indonesia (ID)
- Contoh: `https://date.nager.at/api/v3/publicholidays/2025/ID`

## Cara Mengimplementasikan API Eksternal

Untuk menggunakan API eksternal, Anda bisa memodifikasi method `getNationalHolidays()` di `HolidayController.php`:

```php
private function getNationalHolidays($year)
{
    try {
        // Gunakan HTTP Client Laravel untuk mengambil data dari API
        $response = Http::timeout(10)->get("https://api.harilibur.id/v1/holidays", [
            'year' => $year
        ]);

        if ($response->successful()) {
            $holidays = [];
            foreach ($response->json() as $holiday) {
                $holidays[] = [
                    'tanggal' => $holiday['holiday_date'],
                    'keterangan' => $holiday['holiday_name']
                ];
            }
            return $holidays;
        }
    } catch (Exception $e) {
        Log::warning('Failed to fetch holidays from API: ' . $e->getMessage());
    }

    // Fallback ke data manual jika API gagal
    return $this->getManualHolidays($year);
}
```

## Libraries PHP untuk Hari Libur

### 1. **nesbot/carbon**

Sudah include di Laravel, bisa digunakan untuk:

- Menghitung hari kerja
- Skip weekend dan holiday
- Format tanggal Indonesia

### 2. **spatie/laravel-holidays**

```bash
composer require spatie/laravel-holidays
```

Package ini menyediakan:

- Data hari libur untuk berbagai negara
- Support untuk Indonesia
- Easy integration dengan Laravel

Contoh penggunaan:

```php
use Spatie\Holidays\Holidays;

$holidays = Holidays::for(country: 'id', year: 2025)->get();
```

### 3. **azuyalabs/yasumi**

```bash
composer require azuyalabs/yasumi
```

Library komprehensif untuk hari libur internasional:

```php
use Yasumi\Yasumi;

$holidays = Yasumi::create('Indonesia', 2025);
```

## Rekomendasi

1. **Untuk saat ini**: Gunakan data manual yang sudah ada karena sudah mencukupi
2. **Untuk pengembangan**: Implementasikan `spatie/laravel-holidays` karena:
   - Terintegrasi baik dengan Laravel
   - Mendukung Indonesia
   - Mudah digunakan
   - Maintained dengan baik

3. **Untuk backup**: Tetap simpan data manual sebagai fallback jika API eksternal down

## Contoh Implementasi dengan Spatie Holidays

```php
// Install package
composer require spatie/laravel-holidays

// Di HolidayController.php
use Spatie\Holidays\Holidays;

private function getNationalHolidays($year)
{
    try {
        $holidays = Holidays::for(country: 'id', year: $year)->get();

        $result = [];
        foreach ($holidays as $date => $name) {
            $result[] = [
                'tanggal' => $date,
                'keterangan' => $name
            ];
        }

        return $result;
    } catch (Exception $e) {
        // Fallback ke data manual
        return $this->getManualHolidays($year);
    }
}
```

Implementasi ini akan memberikan data hari libur yang akurat dan up-to-date untuk Indonesia.
