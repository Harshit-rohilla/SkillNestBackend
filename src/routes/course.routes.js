import {Router} from "express";
import {upload} from "../middlewares/multer.middleware.js"
import {createCourse,sendOnlyCategories,sendAllCourses,createSection,updateSection,deleteSection,createSubSection,updateSubSection,deleteSubSection,sendCourseDetail,createRatingAndReview,sendAllRatingAndReview,ratingAndReviews,createCategory,sendAllCategories,sendCategory,enrolledCourses,getCartItems,addItemToCart,removeItemFromCart,updateCourse, publishCourse, draftCourse, deleteCourse,halfCourseDetail,studentEnrolledCourses,viewCourseData,dashboardData} from "../controllers/course.controller.js"
import {isStudent,isInstructor,authenticate} from "../middlewares/auth.middleware.js"
const courseRouter=Router()

// *course routes
courseRouter.route("/create-course").post(upload.single("thumbnail"),authenticate,isInstructor,createCourse)
courseRouter.route("/update-course").post(upload.single("thumbnail"),authenticate,isInstructor,updateCourse)
courseRouter.route("/half-course-detail").post(halfCourseDetail)
courseRouter.route("/view-course-detail").post(authenticate,isStudent,viewCourseData) //*when student is viewing lectures
// courseRouter.route("/send-all-courses").get(authenticate,isStudent,sendAllCourses)
courseRouter.route("/delete-course").delete(authenticate,isInstructor,deleteCourse)
// courseRouter.route("/mark-completed").post(authenticate,isStudent,videoCompleted)
courseRouter.route("/student-enrolled-courses").get(authenticate,isStudent,studentEnrolledCourses)
courseRouter.route("/enrolled-courses").get(authenticate,isInstructor,enrolledCourses) //*course that an instructor made
courseRouter.route("/send-course-detail").post(authenticate,isInstructor,sendCourseDetail) //*used when instructor tries to edit his course that's why he need all info about that course

// *section routes
courseRouter.route("/create-section").post(authenticate,isInstructor,createSection)
courseRouter.route("/update-section").put(authenticate,isInstructor,updateSection)
courseRouter.route("/delete-section").delete(authenticate,isInstructor,deleteSection)

// *subsection routes
courseRouter.route("/create-sub-section").post(upload.single("video"),authenticate,isInstructor,createSubSection)
courseRouter.route("/update-sub-section").put(upload.single("video"),authenticate,isInstructor,updateSubSection)
courseRouter.route("/delete-sub-section").delete(authenticate,isInstructor,deleteSubSection)

// *rating and review routes
courseRouter.route("/create-rating-review").post(authenticate,isStudent,createRatingAndReview)
courseRouter.route("/send-all-rating-review").get(sendAllRatingAndReview)
courseRouter.route("/send-rating-review").get(authenticate,isStudent,ratingAndReviews) //*for particular course

// *category routes
courseRouter.route("/create-category").post(createCategory)
// courseRouter.route("/send-all-categories").get(sendAllCategories)
courseRouter.route("/send-category").post(sendCategory) //*send specific category data with course field populated
courseRouter.route("/send-only-categories").get(sendOnlyCategories) //*send only categories name for navbar

// *cart routes
courseRouter.route("/get-cart-items").get(authenticate,isStudent,getCartItems)
courseRouter.route("/add-item-to-cart").post(authenticate,isStudent,addItemToCart)
courseRouter.route("/remove-item-from-cart").post(authenticate,isStudent,removeItemFromCart)

// *status routes
courseRouter.route("/publish-course").post(authenticate,isInstructor,publishCourse)
courseRouter.route("/draft-course").post(authenticate,isInstructor,draftCourse)

// *miscleneous
courseRouter.route("/dashboard-data").get(authenticate,isInstructor,dashboardData)





export default courseRouter