<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Swine\SwineController;
use App\Http\Controllers\Swine\SwineMultiController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\UserInformationController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Swine\SwineGroupController;
// use App\Http\Controllers\SwineCrudController;
use App\Models\UserInformation;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\Marketplace\MarketplaceController;
use App\Http\Controllers\Marketplace\SellerListingController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Marketplace\SellerMarketplaceController;
use App\Http\Controllers\Marketplace\SellerTransactionController;
use App\Http\Controllers\Marketplace\BuyerTransactionController;
use App\Http\Controllers\Marketplace\NotificationController;
use App\Http\Controllers\ImosAdmin\DashboardController;
use App\Http\Controllers\ImosAdmin\FacilitateController;
use App\Http\Controllers\ImosAdmin\AdminProfileController;
use App\Http\Controllers\Form\LivestockInsuranceApplicationController;
use App\Http\Controllers\Form\VeterinaryDiseaseReportController;
use App\Http\Controllers\ImosAdmin\AdminController;
use App\Http\Controllers\ImosAdmin\AdminScheduleController;

use App\Http\Controllers\ImosAdmin\InsuranceController;
use App\Events\TestEvent;
use Illuminate\Support\Facades\Auth;
use SebastianBergmann\CodeCoverage\Report\Html\Dashboard;
use App\Http\Controllers\PDF\LivestockInsuranceController;
use App\Http\Controllers\CMS\BlogPostController;
use App\Http\Controllers\CMS\FeedController;
use App\Http\Controllers\CMS\BlogCommentController;
use App\Http\Controllers\Farmer\FarmerHomeController;
use App\Http\Controllers\CMS\AuthorBlogController;
use App\Http\Controllers\CMS\AdminCMSController;
use App\Http\Controllers\CMS\BlogLikeController;
use App\Http\Controllers\Farmer\FarmComplianceController;
use App\Http\Controllers\FarmerRatingController;
use App\Http\Controllers\VeterinaryRequestController;
use App\Http\Controllers\ImosNotificationController;
use App\Http\Controllers\LivestockLossNoticeController;
use App\Http\Controllers\LivestockServiceController;
use App\Http\Controllers\Marketplace\DirectSaleController;
use App\Http\Controllers\PriceControlController;
use App\Http\Controllers\ServiceBookingController;
use App\Http\Controllers\ServiceRatingController;
use App\Http\Controllers\VetmedClearanceController;

// Route::get('/', function () {
//     return Inertia::render('welcome');
// })->name('home');


Route::get('/', [AdminCMSController::class, 'welcomePage'])->name('home');

Route::get('/broadcast-test', function () {
    $msg = 'Hello from Laravel Reverb via route!';
    event(new App\Events\TestEvent($msg));
    return $msg; // now the HTTP response is same as broadcast message
});


Route::get('/test-realtime', function () {
    return inertia('TestRealtime');
});

Route::get('/swine-mortality-insurance', function () {
    return view('swine_mortality_info');
})->name('swine.mortality.info');




Route::middleware(['auth'])->group(function () {
    Route::get('/imos-notifications', [ImosNotificationController::class, 'index']);
    Route::post('/imos-notifications/{id}/read', [ImosNotificationController::class, 'markAsRead']);
    Route::post('/imos-notifications/read-all', [ImosNotificationController::class, 'markAllAsRead']);


    // / Farm Compliance Routes (accessible by both farmers and admins)
Route::prefix('farm-compliance')->group(function () {
    Route::get('/details', [FarmComplianceController::class, 'show'])->name('farm-compliance.details');
    Route::get('/register', [FarmComplianceController::class, 'create'])->name('farm-compliance.register');
    Route::post('/register', [FarmComplianceController::class, 'store'])->name('farm-compliance.store');
    Route::get('/{id}', [FarmComplianceController::class, 'show'])->name('farm-compliance.show');
    Route::put('/{id}', [FarmComplianceController::class, 'update'])->name('farm-compliance.update');
    Route::delete('/{id}', [FarmComplianceController::class, 'destroy'])->name('farm-compliance.destroy');
});

// Admin Routes for Farm Compliance Management
Route::prefix('admin')->middleware(['auth'])->group(function () {
    Route::get('/farm-compliances', [FarmComplianceController::class, 'index'])->name('admin.farm-compliances.index');
    Route::get('/farm-compliances/{id}', [FarmComplianceController::class, 'show'])->name('admin.farm-compliances.show');
       Route::get('/price-control', [PriceControlController::class, 'index'])->name('price-control.index');
    Route::put('/price-control/{id}', [PriceControlController::class, 'update'])->name('price-control.update');
    Route::post('/price-control/multiple', [PriceControlController::class, 'updateMultiple'])->name('price-control.update-multiple');
    Route::post('/price-control', [PriceControlController::class, 'store'])->name('price-control.store');
    Route::delete('/price-control/{id}', [PriceControlController::class, 'destroy'])->name('price-control.destroy');

    });

// Admin routes for price management
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
 });

});

// routes/web.php







Route::middleware(['auth', 'role:admin,enforcer'])->group(function () {
    Route::get('/admin/dashboard', [DashboardController::class, 'index'])->name('admin.index');
    Route::get('/facilitate', [FacilitateController::class, 'index'])->name('facilitate.index');
    Route::get('/admin/swine-production', [DashboardController::class, 'show'])
    ->middleware(['auth', 'role:admin'])
    ->name('swine.production');
    // routes/web.php
Route::get('/admin/swine-production/exportbreed', [DashboardController::class, 'exportbreed'])
    ->name('swine.production.exportbreed');
    Route::get('/admin/swine-production/export-last6years', [DashboardController::class, 'exportCSVLast6Years'])
    ->middleware(['auth', 'role:admin'])
    ->name('swine.production.export6years');


    Route::get('/swine/production/export', [DashboardController::class, 'exportForecast'])
    ->name('swine.production.export');
Route::get('/swine/production/exportcsv', [DashboardController::class, 'exportCSV'])
    ->name('swine.production.exportCSV');



    // Users
    Route::get('/facilitate/users', [FacilitateController::class, 'index'])->name('facilitate.users.index');
    Route::get('/facilitate/users/create', [FacilitateController::class, 'createUser'])->name('facilitate.users.create'); // put first
    Route::get('/facilitate/users/{id}', [FacilitateController::class, 'show'])->name('facilitate.users.show'); // after
  
     Route::get('/facilitate/users/{id}/edit', [FacilitateController::class, 'editUser'])->name('facilitate.users.edit');
    Route::post('/admin/facilitate/users', [FacilitateController::class, 'store'])->name('facilitate.users.store');
    Route::put('/admin/facilitate/users/{id}', [FacilitateController::class, 'updateUser'])->name('facilitate.users.update');
   
   //PDF Livestock insurance form
    Route::get('/insurance/{id}/pdf/preview', [LivestockInsuranceController::class, 'previewPdf'])
        ->name('insurance.pdf.preview');
 Route::get('/insurance/{id}/pdf/previews', [LivestockInsuranceController::class, 'previewPdfs'])
        ->name('insurance.pdf.preview');

    Route::get('/insurance/{id}/pdf/downloads', [LivestockInsuranceController::class, 'downloadPdf'])
        ->name('insurance.pdf.download');

          Route::get('/insurance/{id}/pdf/downloadempty', [LivestockInsuranceController::class, 'download'])
        ->name('insurance.pdf.downloadempty'); //the empty pdf

      Route::get('/insurance/{id}/pdf/downloadreport', [LivestockInsuranceController::class, 'downloadreport'])
        ->name('insurance.pdf.download');

    Route::get('/insurance', [\App\Http\Controllers\ImosAdmin\InsuranceController::class, 'index'])
        ->name('admin.insurance.index');

        Route::get('/insurance/signature/{id}/editor', [InsuranceController::class, 'signatureEditor'])
    ->name('admin.insurance.signature-editor');

    
  Route::get('admin/profile', [AdminProfileController::class, 'index'])->name('imos_admin.profile');
Route::post('imos_admin/profile/signature', [AdminProfileController::class, 'uploadSignature'])->name('imos_admin.profile.uploadSignature');
    Route::get('/imos_admin/profile/signature/get', [ProfileController::class, 'getSignature']);

//    Schedules
    Route::get('/admin/events', [AdminScheduleController::class, 'list'])->name('admin.schedules.list');
        Route::get('/admin/schedules/calendar', [AdminScheduleController::class, 'schedule'])->name('admin.schedule.calendar');
  Route::post('/admin/events/store', [AdminScheduleController::class, 'store'])->name('admin.events.store');
Route::put('/admin/events/{event}', [AdminScheduleController::class, 'update'])->name('admin.events.update');

Route::delete('/admin/event/{id}', [AdminScheduleController::class, 'destroy'])
    ->name('admin.events.destroy');


// Veterinary routes------------------------------------------------------------

 Route::get('/veterinary-disease-report/{id}/edit', [VeterinaryDiseaseReportController::class, 'edit'])
    ->name('veterinary.report.edit');
    Route::put('/veterinary-disease-report/update/{id}', [VeterinaryDiseaseReportController::class, 'update'])->name('veterinary-disease-report.update');
    Route::post('/veterinary-disease-report/store', [VeterinaryDiseaseReportController::class, 'store'])
    ->name('veterinary.report.store');
    //  Route::post('/veterinary-disease-report/create', [VeterinaryDiseaseReportController::class, 'create'])
    // ->name('veterinary.report.create');
Route::get('/insurance/veterinary-form', [VeterinaryDiseaseReportController::class, 'index'])
    ->name('insurance.veterinary.form');
    // Route::get('/insurance/farmers', [VeterinaryDiseaseReportController::class, 'listFarmers']);


    Route::get('/veterinary/farmers/list', [VeterinaryDiseaseReportController::class, 'indexPage'])->name('indexPage');
// routes/web.php
Route::get('/api/insurance/farmers/list', [VeterinaryDiseaseReportController::class, 'apiList']);
Route::get('/insurance/farmer/livestocks/{id}', [VeterinaryDiseaseReportController::class, 'showLivestocks'])
    ->name('insurance.farmer.livestocks');

    // routes/web.php
// Route::get('/veterinary-disease-report/animal/{id}', [VeterinaryDiseaseReportController::class, 'showAnimalReport'])
//     ->name('veterinary.animal.report');
Route::get('/veterinary-disease-report/{report}/view', [VeterinaryDiseaseReportController::class, 'viewAnimalReport'])
    ->name('veterinary.report.view');




    

// File: routes/web.php

Route::get('/veterinary-reports/all', [VeterinaryDiseaseReportController::class, 'allVeterinaryReports'])
    ->name('insurance.veterinary.reports.all');

    

Route::delete('/veterinary-report/detach/{animalId}',
    [VeterinaryDiseaseReportController::class, 'detachReport']);
Route::get('/api/veterinary-report/{id}', function ($id) {
    return \App\Models\PDF\VeterinaryDiseaseReport::findOrFail($id);
});


Route::get('/api/farmer/{farmerId}/animals', [VeterinaryDiseaseReportController::class, 'getFarmerAnimals']);


     Route::prefix('vetpdf')->group(function () {
    Route::get('/show/{id}', [App\Http\Controllers\PDF\VeterinaryDiseaseReportController::class, 'show'])->name('vetpdf.show');
    Route::get('/download/{id}', [VeterinaryDiseaseReportController::class, 'generatePdf'])->name('vetpdf.download');
});


// routes/web.php or routes/api.php
Route::put('/veterinary-request/{id}/update-status', [VeterinaryRequestController::class, 'updateStatus']);
Route::delete('/veterinary-requests/{id}', [VeterinaryRequestController::class, 'destroy'])
    ->name('veterinary-requests.destroy');

    });


Route::middleware(['auth'])->prefix('cms')->group(function () {
     Route::get('/create', [BlogPostController::class, 'create'])
        ->name('cms.blog.create');

         Route::get('/admin/create', [BlogPostController::class, 'admincreate'])
        ->name('admin.create');

    Route::post('/posts', [BlogPostController::class, 'store'])
        ->name('cms.blog.store');

    Route::get('/blog/{slug}', [BlogPostController::class, 'publicShow'])
    ->name('blog.public.show');
    // routes/web.php

// Route to show the edit form
Route::get('/blog/{id}/edit', [BlogPostController::class, 'edit'])
    ->name('blog.edit');

// Route to handle the update submission
Route::put('/blog/{id}', [BlogPostController::class, 'update'])
    ->name('blog.update');
Route::post('/posts/upload-image', [BlogPostController::class, 'uploadImage']);

 Route::get('/blog', [FeedController::class, 'index'])->name('cms.blog.index');
 Route::delete('/blog/{id}', [BlogPostController::class, 'destroy'])
    ->name('blog.destroy');
    
    Route::get('/exit', BlogPostController::class)->name('cms.exit');


     Route::post('/posts/{post}/comments', 
        [BlogCommentController::class, 'store']
    )->name('comments.store');

    Route::delete('/comments/{comment}', 
        [BlogCommentController::class, 'destroy']
    )->name('comments.destroy');

    Route::put('/comments/{comment}', [BlogCommentController::class, 'update']);

     Route::get('/admin/bloglist', [AdminCMSController::class, 'index'])
        ->name('cms.posts.index');

    Route::delete('/admin/bloglist/{id}', [AdminCMSController::class, 'destroy'])
        ->name('cms.posts.destroy');
Route::post('/posts/{id}/status', [AdminCMSController::class, 'updateStatus'])
    ->name('cms.posts.status');

});

// ---------------------------
// Routes for authenticated users
// ---------------------------
Route::middleware(['auth', 'verified',])->group(function () {




Route::middleware(['auth'])->group(function () {
    Route::resource('vetmed-clearance', VetmedClearanceController::class);

});

// Admin Routes - for admins only
Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/vetmed-clearances', [VetmedClearanceController::class, 'adminIndex'])->name('vetmed.index');
    Route::patch('/vetmed-clearances/{vetmedClearance}/status', [VetmedClearanceController::class, 'updateStatus'])->name('vetmed.update-status');
});



// Simple route to view the PDF
Route::get('/livestock-loss-notice', [LivestockLossNoticeController::class, 'show'])
    ->name('loss.notice.show');

// Route to view with sample data
Route::get('/livestock-loss-notice/sample', [LivestockLossNoticeController::class, 'showWithData'])
    ->name('loss.notice.sample');

// Route to download the PDF
Route::get('/livestock-loss-notice/download', [LivestockLossNoticeController::class, 'download'])
    ->name('loss.notice.download');

// Route to view multiple forms
Route::get('/livestock-loss-notice/multiple', [LivestockLossNoticeController::class, 'showMultiple'])
    ->name('loss.notice.multiple');






   Route::post('/cms/uploads', [\App\Http\Controllers\CMS\MediaController::class, 'upload']);
    Route::delete('/cms/uploads', [\App\Http\Controllers\CMS\MediaController::class, 'delete']);
       Route::get('/cms/author', [AuthorBlogController::class, 'index'])
        ->name('cms.author.index');
        Route::post('/cms/posts/{post}/like', [BlogLikeController::class, 'toggle'])
    ->name('cms.posts.like');
    Route::get('/cms/posts/{post}/like-status', [BlogLikeController::class, 'status'])
    ->name('cms.posts.like-status');

        Route::get('/try', [AdminCMSController::class, 'homeFeatured']);

    //TO save the signature postion and size
    Route::post('/insurance/signature/{id}/save', [InsuranceController::class, 'saveSignature'])
     ->name('insurance.signature.save');
     Route::post('/insurance/signature/{id}/saves', [InsuranceController::class, 'saveSignatures'])
     ->name('insurance.signature.save');
     Route::get('/insurance/{id}/pdf/download', [InsuranceController::class, 'download']);


            Route::get('/veterinary/farmer/list', [VeterinaryDiseaseReportController::class, 'indexPages'])->name('indexPages');

     // routes/web.php
Route::get('/insurance/{id}/preview-image', [InsuranceController::class, 'previewImage']);


Route::post('/insurance/{id}/signature/save', [InsuranceController::class, 'save']);
Route::get('/insurance/signature/{id}', [InsuranceController::class, 'getSignature']);


// routes/web.php
Route::post('/insurance/signature/{application}', [App\Http\Controllers\ImosAdmin\InsuranceController::class, 'save'])
    ->name('insurance.signature.save');



      Route::get('/insurance/application/create', 
        [LivestockInsuranceApplicationController::class, 'create']
    )->name('insurance.application.create');

    Route::post('/insurance/application', 
        [LivestockInsuranceApplicationController::class, 'store']
    )->name('insurance.application.store');

    Route::get('/insurance/application/{application}', 
        [LivestockInsuranceApplicationController::class, 'show']
    )->name('insurance.application.show');

   Route::post('/insurance/application/{application}/animal', [LivestockInsuranceApplicationController::class, 'addAnimal']);
    // Add multiple animals
    
Route::post('/insurance/{application}/animals/add-multiple', [
    LivestockInsuranceApplicationController::class,
    'addMultipleAnimals'
])->name('insurance.animals.addMultiple');
Route::put('/insurance/animal/{id}', [LivestockInsuranceApplicationController::class, 'updateAnimal']);

   Route::delete('/insurance/animal/{id}', [LivestockInsuranceApplicationController::class, 'deleteAnimal']);

Route::get('/insurance/application/{id}/edit', [LivestockInsuranceApplicationController::class, 'edit'])->name('insurance.edit');
Route::put('/insurance/{id}', [LivestockInsuranceApplicationController::class, 'update'])->name('insurance.update');




    Route::post('/user/choose-role', [UserController::class, 'chooseRole'])->name('user.chooseRole');
    // 1️⃣ Profile Prompt (shown after login if user has no profile)
    Route::get('/profile-prompt', function () {
        return Inertia::render('UserProfile/Prompt'); // <-- match your file name
    })->name('profile.prompt');

    // NOTIFICATION FOR Buyers
    Route::get('/marketplace/notification', [NotificationController::class, 'index']);
    Route::post('/marketplace/notification/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/marketplace/notification/read-all', [NotificationController::class, 'markAllAsRead']);



    // routes/web.php
    Route::post('/user/ping', [UserController::class, 'ping'])->middleware('auth');

    // ------------------ Chat/Messenger -------------------
    Route::get('/messenger', function () {
        // @phpstan-ignore-next-line
        return Inertia::render('Messenger', [
            'conversation' => request()->query('conversation')
        ]);
    }); // ✅ properly closed
    // Conversation and messaging routes
    Route::post('/conversations/start', [ConversationController::class, 'start'])->name('conversations.start');
    Route::get('/users', [UserController::class, 'index'])->middleware('auth');
    Route::get('/conversations', [ConversationController::class, 'index']);
    Route::post('/conversations', [ConversationController::class, 'store']);
    Route::get('/conversations/{id}', [ConversationController::class, 'show']); // ✅ Add this
    Route::get('/conversations/{conversation}/messages', [MessageController::class, 'index']);
    Route::post('/conversations/{conversation}/messages', [MessageController::class, 'send']);
    Route::post('/conversations/{conversation}/typing', [MessageController::class, 'typing']);
    Route::put('/messages/{message}', [MessageController::class, 'update']);
    Route::delete('/messages/{message}', [MessageController::class, 'destroy']);
    // In your routes file


Route::post('/conversations/{conversation}/mark-read', [MessageController::class, 'markAsRead']);

    // ------------------ Marketplace -------------------
    Route::middleware(['auth'])->prefix('marketplace')->group(function () {
        Route::get('/profile/{id}', [MarketplaceController::class, 'showProfile'])->name('marketplace.profile.show');
        Route::get('/profile', [MarketplaceController::class, 'showOwn'])->name('marketplace.profile.own');
        Route::get('/profileshow', [SellerMarketplaceController::class, 'edit'])->name('marketplace.seller.profile.edit');
        Route::post('/profile', [SellerMarketplaceController::class, 'update'])->name('marketplace.seller.profile.update');
    });

    Route::prefix('marketplace')->name('marketplace.')->group(function () {

        Route::get('/seller/create', [SellerListingController::class, 'create'])->name('seller.create');
        Route::get('/', [MarketplaceController::class, 'index'])->name('index');
     
        Route::get('/load-more', [MarketplaceController::class, 'loadMore'])->name('loadMore');
        Route::get('/transaction/{id}/setup', [SellerTransactionController::class, 'setup'])
            ->name('transaction.setup');

        Route::post('/transaction/{id}/approve', [SellerTransactionController::class, 'approve'])
            ->name('transaction.approve');
        Route::post('/transaction/{id}/complete', [SellerTransactionController::class, 'completeTransaction'])->name('transaction.complete');
        Route::post('/transaction/updateWeight/{id}', [SellerTransactionController::class, 'updateWeight'])
            ->name('transaction.updateWeight'); // ✅ fixed name
Route::post('/transaction/update-final-amount/{listingSwineId}', [BuyerTransactionController::class, 'updateFinalAmount'])
    ->name('transaction.updateFinalAmount');
    Route::post('/transactions/{transaction}/update-price', [BuyerTransactionController::class, 'updatePrice'])
     ->name('transaction.updatePrice');

        // routes/web.php buyers transaction route
        // 🧠 Buyer Transaction Routes
        Route::get('/buyer/transactions', [BuyerTransactionController::class, 'index'])
            ->name('buyer.transactions');
        Route::get('/transactions/{id}/buyer', [BuyerTransactionController::class, 'setup'])
            ->name('buyer.transaction.setup');

             Route::post('/transactions/{transaction}/add-swine', [BuyerTransactionController::class, 'addSwineToTransaction'])
         ->name('transaction.addSwine');
    
    Route::post('/transactions/{transaction}/remove-swine', [BuyerTransactionController::class,'removeSwineFromTransaction'])
           ->name('transaction.removeSwine');

           Route::get('/transaction/{id}/receipt', [BuyerTransactionController::class, 'receipt'])
    ->name('transaction.receipt');


        
    //     Route::delete('/transactions/{id}/delete', [BuyerTransactionController::class, 'destroy'])
    // ->name('marketplace.transaction.delete');

        Route::post('/transaction/{id}/cancel', [BuyerTransactionController::class, 'cancel'])
            ->name('transaction.cancel');

        Route::delete('/transaction/{id}/delete', [BuyerTransactionController::class, 'delete'])
            ->name('transaction.delete');

        Route::post('/buyer/transaction/{id}/confirm', [BuyerTransactionController::class, 'confirm'])
            ->name('buyer.transaction.confirm');
        Route::post('/buyer/transaction/{id}/cancel', [BuyerTransactionController::class, 'cancel'])
            ->name('buyer.transaction.cancel');
        // routes/web.php
        Route::post('/transaction/{id}/complete-buyer', [BuyerTransactionController::class, 'completeByBuyer'])
            ->name('marketplace.transaction.completeBuyer');

            Route::post('transaction/{transaction}/mark-as-done', [BuyerTransactionController::class, 'markAsDone'])
            ->name('transaction.markAsDone');

            Route::get('services', [LivestockServiceController::class, 'index'])->name('services.index');
    Route::get('/services/create', [LivestockServiceController::class, 'create'])
        ->name('services.create');

    Route::post('/services', [LivestockServiceController::class, 'store'])
        ->name('services.store');

            Route::get('services/{service}/edit', [LivestockServiceController::class, 'edit'])->name('services.edit');
    Route::put('services/{service}', [LivestockServiceController::class, 'update'])->name('services.update');
Route::delete('/services/{service}', [LivestockServiceController::class, 'destroy'])->name('services.destroy');


 Route::post('/services/bookings', [ServiceBookingController::class, 'store'])->name('services.bookings.store');
    Route::post('/services/bookings/{booking}/update-status', [ServiceBookingController::class, 'updateStatus'])->name('services.bookings.update-status');
    Route::post('/services/bookings/{booking}/complete', [ServiceBookingController::class, 'complete'])->name('services.bookings.complete');
    
    // Customer bookings page
    Route::get('/services/my-bookings', [ServiceBookingController::class, 'myBookings'])->name('services.bookings.my-bookings');
    
    // Provider bookings page
    Route::delete('/services/bookings/{booking}', [ServiceBookingController::class, 'destroy'])->name('services.bookings.destroy');


    // Ratings
    Route::get('/services/ratings/booking/{booking}', [ServiceRatingController::class, 'showRatingPage'])->name('services.ratings.create');
    Route::get('/services/ratings/{rating}/edit', [ServiceRatingController::class, 'editRating'])->name('services.ratings.edit');
    Route::post('/services/ratings', [ServiceRatingController::class, 'store'])->name('services.ratings.store');
    Route::put('/services/ratings/{rating}', [ServiceRatingController::class, 'update'])->name('services.ratings.update');
    Route::delete('/services/ratings/{rating}', [ServiceRatingController::class, 'destroy'])->name('services.ratings.destroy');

   Route::get('/{listing}', [MarketplaceController::class, 'show'])->name('show');

        //notification



        // farmer rating

           Route::post('/transactions/{transaction}/rate', [FarmerRatingController::class, 'storeOrUpdate'])
        ->name('transaction.rate');
    Route::get('/transactions/{transaction}/rating', [FarmerRatingController::class, 'getRating'])
        ->name('transaction.get-rating');
    Route::delete('/ratings/{rating}', [FarmerRatingController::class, 'destroy'])
        ->name('rating.destroy');
    });

  

    // 2️⃣ User Information Form (create + store)
    Route::get('/user-informations/create', [UserInformationController::class, 'create'])
        ->name('user_informations.create');
    Route::post('/swine-request/store', [MarketplaceController::class, 'storeRequest'])
        ->name('swine-request.store');



    // 3️⃣ Location API routes (for dropdowns)
    Route::get('/provinces', [LocationController::class, 'getProvinces'])
        ->name('locations.provinces');
    Route::get('/municipalities/{province_id}', [LocationController::class, 'getMunicipalities'])
        ->name('locations.municipalities');
    Route::get('/barangays/{municipal_id}', [LocationController::class, 'getBarangays'])
        ->name('locations.barangays');

    Route::middleware(['auth', 'role:farmer'])->group(function () {
        Route::prefix('swine-management/expenses')->name('expenses.')->group(function () {
            Route::get('/', [ExpenseController::class, 'index'])->name('index');
            Route::post('/', [ExpenseController::class, 'store'])->name('store');
            Route::delete('/{expense}', [ExpenseController::class, 'destroy'])->name('destroy');
            Route::put('/{expense}', [ExpenseController::class, 'update'])->name('update');
        });
    });

    Route::post('/user-informations', [UserInformationController::class, 'store'])->name('user_informations.store');
Route::get('/DA/personnels', [UserController::class, 'da_personel'])->name('da.personnel'); // Add appropriate middleware

    Route::middleware(['role:farmer'])->group(function () {
        Route::get('/swine-management', [SwineController::class, 'dashboard'])->name('swine.management.dashboard');
        Route::get('/swine-management/financial-performance', [SwineController::class, 'financialPerformance'])->name('swine.management.financial-performance');
    
        // Profile page
        Route::post('/veterinary-request', [VeterinaryRequestController::class, 'store'])
    ->name('veterinary.request.store');

        Route::get('/profile', [UserInformationController::class, 'show'])
            ->name('user.profile');
          Route::get('/farmer/profile/', [FacilitateController::class, 'farmershow'])->name('farmer.profile.show'); // after

        // 4️⃣ Swine & Expenses CRUD
        // Route::resource('swine', SwineController::class)->only(['index', 'store', 'update', 'destroy']);
        // Route::resource('expenses', ExpenseController::class)->only(['index', 'store', 'update', 'destroy']);

        // 5️⃣ Dashboard & Other Pages
        Route::get('dashboard', function () {
            return Inertia::render('dashboard');
        })->name('dashboard');
        Route::get('page', function () {
            return Inertia::render('Page');
        })->name('page');

        // Settings---------------------------
        // fetching information of the user
        Route::get('/profile-information', [ProfileController::class, 'profileInformation'])
            ->name('profile-information');

        Route::get('/profile-information/create', [ProfileController::class, 'create'])
            ->name('profile_information.create');

        Route::post('/profile-information/store', [ProfileController::class, 'store'])
            ->name('profile_information.store');

        Route::put('/user-informations/{id}', [UserInformationController::class, 'updateProfileInformation'])
            ->name('user-informations.update');


        // routes/web.php
        // Route::put('/user-information/{userInformation}', [ProfileController::class, 'updateUserInformation'])
        //     ->name('user-information.update');

        //     Route::get('/user-information/edit', [ProfileController::class, 'editUserInformation'])
        //     ->name('user-information.edit');
        Route::delete('/swine-management/swine/multidelete', [SwineController::class, 'multidelete'])->name('swine.multidelete');

        // This will create all routes EXCEPT 'show' and 'index'
Route::resource('swine-management/swine', SwineController::class)
    ->except(['show']);

// Then manually add your custom index route
Route::get('my-swine', [SwineController::class, 'index'])->name('swine-management.swine.index');


        Route::resource('swine-management/swine/multicreate', SwineMultiController::class);
        Route::put('/swine/{swine_id}/listing/{listing_id}', [SwineController::class, 'updateListingSwine'])
            ->name('swine.listing.update');

       
            
            // FARMERS DASHBOARD=======================================
            Route::middleware('auth')->get('/farmer/home', [FarmerHomeController::class, 'index'])->name('farmer.home');
            // Route::get('/farm-compliance/details', [FarmerHomeController::class, 'showFarmCompliance'])->name('farm-compliance.details');

            // Farm Compliance Routes


        //---------------------HomePage
        Route::get('/home', function () {
            return Inertia::render('home/index');
        });

        Route::get('/swine/{id}', [SwineController::class, 'show'])->name('swine.show');
        Route::put('/swine/{id}', [SwineController::class, 'update_swine'])->name('swine.update_swine');


        // Create group
        Route::get('/swine-groups', [SwineGroupController::class, 'index'])->name('swine-groups.index');
        Route::post('/swine-groups', [SwineGroupController::class, 'store'])->name('swine-groups.store');
        Route::post('/swine-groups/attach', [SwineGroupController::class, 'attachSwine'])->name('swine-groups.attach');
        Route::post('/swine/bulk-assign', [SwineGroupController::class, 'bulkAssign'])->name('swine.bulk-assign');
        Route::delete('/swine/bulk-delete', [SwineController::class, 'bulkDelete'])->name('swine.bulk-delete');

        Route::prefix('swine/groups')->name('swine.groups.')->group(function () {

            Route::put('/{group}', [SwineGroupController::class, 'update'])->name('update');
            Route::delete('/{group}', [SwineGroupController::class, 'destroy'])->name('destroy');
            // Route::delete('/members', [SwineGroupController::class, 'removeMember'])->name('members.destroy');
        });
        Route::delete('/swines/groups/{group}/members/{swine}', [SwineGroupController::class, 'removeMember'])
            ->name('swines.groups.members.destroy');

        Route::post('/swine/{swine}/assign-group', [SwineGroupController::class, 'assign'])
            ->name('swine-group.assign')
            ->middleware('auth');

        // Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar.index');

        Route::get('/swine-management/schedules-calendar', [ScheduleController::class, 'schedule'])->name('schedule.schedules');
        Route::get('/swine-management/schedules', [ScheduleController::class, 'list'])->name('schedules.list');
        // Create new schedule (POST)
        Route::post('/swine-management/schedules', [ScheduleController::class, 'store'])
            ->name('schedules.store');
        Route::get('/swine-management/schedules/edit/{id}', [ScheduleController::class, 'edit'])
            ->name('schedules.edit');
        Route::put('/swine-management/schedules/{id}', [ScheduleController::class, 'update'])
            ->name('schedules.update');




        Route::get('/schedules-old', [ScheduleController::class, 'index'])->name('schedules.index');
        Route::get('/swine-management/schedules/create', [ScheduleController::class, 'create'])->name('schedules.create');

        Route::get('/schedules/{schedule}', [ScheduleController::class, 'show'])->name('schedules.show');
        Route::delete('/swine-management/schedules/{id}', [ScheduleController::class, 'destroy'])
            ->name('schedules.destroy');

        Route::prefix('marketplace/seller')->name('marketplace.seller.')->group(function () {

          Route::get('/{transaction}/totalExpenses', [SellerTransactionController::class, 'getTransactionSwineTotalExpenses'])
        ->name('totalExpenses'); // This creates 'marketplace.seller.totalExpenses'
            Route::get('/index', [SellerListingController::class, 'index'])->name('index');

            Route::post('/', [SellerListingController::class, 'store'])->name('store');
            Route::get('/swine/total-expenses', [SellerListingController::class, 'getSwineTotalExpenses'])
    ->middleware(['auth']);


                  Route::get('/direct-sale', [DirectSaleController::class, 'createDirectSale'])
        ->name('direct-sale.create');
    Route::post('/direct-sale', [DirectSaleController::class, 'storeDirectSale'])
        ->name('direct-sale.store');
         Route::get('/direct-sale/{id}/edit', [DirectSaleController::class, 'editDirectSale'])->name('direct-sale.edit');
    Route::put('/direct-sale/{id}', [DirectSaleController::class, 'updateDirectSale'])->name('direct-sale.update');
    Route::delete('/direct-sale/{id}', [DirectSaleController::class, 'destroyDirectSale'])->name('direct-sale.destroy');


            Route::get('/{id}/edit', [SellerListingController::class, 'edit'])->name('edit');
            Route::put('/{id}', [SellerListingController::class, 'update'])->name('update');
            Route::delete('/{id}', [SellerListingController::class, 'destroy'])->name('destroy');
            Route::post('/{listing}/image', [SellerListingController::class, 'updateImage'])->name('updateImage');
            Route::delete('/listings/{listingId}/remove-swine/{swineId}', [SellerListingController::class, 'removeSwine'])->name('removeSwine');
            Route::delete('/{listing}/images/{photo}', [SellerListingController::class, 'deleteGalleryImage'])
                ->name('.images.destroy');
            Route::post('{listing}/images', [SellerListingController::class, 'addGalleryImages'])
                ->name('marketplace.seller.images.add');

            Route::get('requests', [SellerListingController::class, 'requests'])->name('requests');
            Route::post('/{id}/complete', [SellerTransactionController::class, 'completeTransaction'])->name('complete');
            Route::post('/weight/{id}', [SellerTransactionController::class, 'updateWeight'])->name('updateWeight');

           
            // In your routes/web.php or api.php

Route::get('/find-by-swine/{swineId}', [SellerListingController::class, 'findBySwine'])
    ->name('find-by-swine');
        });

        Route::get('/swine-management/activity-log', [SellerTransactionController::class, 'activityLog'])->name('swine.management.activity-log');
   
     Route::get('/services/provider-bookings', [ServiceBookingController::class, 'providerBookings'])->name('services.bookings.provider-bookings');
 });
    // Using web.php for simplicity
    Route::get('/listings/{listing}/swine-requests', [MarketplaceController::class, 'getSwineRequests']);
});



require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/../routes/channels.php';
