import { Course } from "../models/Course.model.js";
import { Category } from "../models/Category.model.js";
import { apiError } from "../utilities/apiError.js";
import { asyncHandler } from "../utilities/asyncHandler.js";
import { uploadOnCloudinary } from "../utilities/cloudinary.js";
import { User } from "../models/User.model.js";
// import { User } from "../models/user.model.js";
import { apiResponse } from "../utilities/apiResponse.js";
import { Section } from "../models/Section.model.js";
import { SubSection } from "../models/SubSection.model.js";
import { RatingAndReviews } from "../models/RatingAndReviews.model.js";
// import {CourseProgress} from "../models/CourseProgress.model.js"


// create course controller
export const createCourse = asyncHandler(async (req, res) => {
  const { title, description, price, category, whatYouWillLearn, tags, instructions } = req.body;
  if (!title || !description || !price || !category || !whatYouWillLearn || !tags || !instructions) {
    throw new apiError(400, "please provide all the details of course");
  }
  const thumbnailLocalPath = req?.file?.path;
  if (!thumbnailLocalPath) {
    throw new apiError(400, "please provide thumbnail");
  }
  const categoryRes = await Category.findOne({ name:category });
  if (!categoryRes) {
    throw new apiError(400, "invalid category");
  }
  
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail) {
    throw new apiError(400, "localPath is not correct to upload on cloudinary");
  }
  const user = req.authPayload;
  const course =await Course.create({
    title,
    description,
    price,
    whatYouWillLearn,
    instructor: user._id,
    category:categoryRes._id,
    tags,
    instructions,
    thumbnail,
  });
  // await Category.findByIdAndUpdate(categoryRes._id,{$push:{course:course._id}})
  const populatedCourse=await Course.findById(course._id).populate("category").populate("courseContent")
  const getUser = await User.findByIdAndUpdate(
    user._id,
    { $push: { courses: course._id } },
    { new: true }
  );
  if (!getUser) {
    throw new apiError(500, "unable to update course in user document");
  }
  res
    .status(200)
    .json(new apiResponse(200, populatedCourse, "course created successfully"));
});

// update course controller
export const updateCourse=asyncHandler(async(req,res)=>{
  const { title, description, price, category, whatYouWillLearn, tags, instructions, courseId } = req.body;
  const course = await Course.findById(courseId)
  if(!course){
    throw new apiError(400,"invalid courseId")
  }
  if(title){
    course.title=title
  }
  if(description){
    course.description=description
  }
  if(price){
    course.price=price
  }
  if(category){
    course.category=category
  }
  if(whatYouWillLearn){
    course.whatYouWillLearn=whatYouWillLearn
  }
  if(instructions){
    course.instructions=instructions
  }
  if(tags){
    course.tags=tags
  }
  const thumbnailLocalPath = req?.file?.path;
  if (thumbnailLocalPath) {
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
      throw new apiError(400, "localPath is not correct to upload on cloudinary");
    }
    course.thumbnail=thumbnail
  }
  
  const newDoc = await course.save({validateBeforeSave:false})
  const updatedCourse=await Course.findById(newDoc._id).populate({path:"courseContent",populate:{path:"subSection"}})

  res.status(200).json(new apiResponse(200,updatedCourse,"course updated successfully"))
})

// delete course controller
export const deleteCourse=asyncHandler(async(req,res)=>{
  const {courseId}=req.body
  if(!courseId){
    throw new apiError(400,"please provide courseId")
  }
  const course=await Course.findById(courseId).populate("courseContent")
  if(!course){
    throw new apiError(400,"course not found")
  }
  // deleting subSection
  for(let section of course.courseContent){
    await SubSection.deleteMany({_id:{$in:section.subSection}})
  }
  // deleting section
  await Section.deleteMany({_id:{$in:course.courseContent}})

  // deleting rating and review
  await RatingAndReviews.deleteMany({_id:{$in:course.ratingAndReviews}})

  // deleting course
  await Course.deleteOne({_id:course._id})
  res.status(200).json(new apiResponse(200,{},"course deleted successfully"))
})

// send all courses controller
export const sendAllCourses = asyncHandler(async (req, res) => {
  const allCourses = await Course.find();
  if (!allCourses) {
    throw new apiError(500, "problem while fetching all the courses");
  }
  res
    .status(200)
    .json(new apiResponse(200, allCourses, "all courses sent successfully"));
});

// create section controller
export const createSection = asyncHandler(async (req, res) => {
  const { title, courseId } = req.body;
  if (!title || !courseId) {
    throw new apiError(400, "provide both title and courseId");
  }
  const newSection = await Section.create({
    title,
  });
  const course = await Course.findByIdAndUpdate(
    courseId,
    { $push: { courseContent: newSection._id } },
    { new: true }
  );
  if (!course) {
    throw new apiError(400, "invalid courseId");
  }
  const populatedCourse=await Course.findById(courseId).populate({path:"courseContent",populate:{path:"subSection"}})
  res
    .status(200)
    .json(new apiResponse(200, populatedCourse, "section created successfully"));
});

// *update section controller
export const updateSection = asyncHandler(async (req, res) => {

  const { newSectionName, sectionId, courseId } = req.body;
  if (!newSectionName || !sectionId || !courseId) {
    throw new apiError(400, "please provide both new title and courseId");
  }

  const newSection = await Section.findByIdAndUpdate(
    sectionId,
    { title: newSectionName },
    { new: true }
  );
  
  if (!newSection) {
    throw new apiError(400, "invalid sectionId");
  }
  const populatedCourse=await Course.findById(courseId).populate({path:"courseContent",populate:{path:"subSection"}})
  // console.log(populatedCourse);
  
  res
    .status(200)
    .json(new apiResponse(200, populatedCourse, "title updated successfully"));
});

// *delete section controller
export const deleteSection = asyncHandler(async (req, res) => {
  const { sectionId, courseId } = req.body;
  if(!sectionId || !courseId){
    throw new apiError(400,"please provide both section and course id")
  }
  const deletedSection = await Section.findByIdAndDelete(sectionId);
  if (!deletedSection) {
    throw new apiError(400, "invalid sectionId");
  }
  const populatedCourse=await Course.findById(courseId).populate({path:"courseContent",populate:{path:"subSection"}})
  res
    .status(200)
    .json(new apiResponse(200,populatedCourse, "Section deleted successfully"));
});

// *create a subsection controller
export const createSubSection = asyncHandler(async (req, res) => {
  const { title, description, sectionId, courseId } = req.body;
  const videoLocalPath = req.file?.path;
  if (!title || !description || !sectionId || !courseId) {
    throw new apiError(400, "please provide all the details");
  }
  if (!videoLocalPath) {
    throw new apiError(400, "please provide video");
  }
  const videoUrl = await uploadOnCloudinary(videoLocalPath);
  if (!videoUrl) {
    throw new apiError(500, "error while uploading video on cloudinary");
  }
  const newSubSection = await SubSection.create({
    title,
    description,
    video: videoUrl,
  });
  const updatedSection = await Section.findByIdAndUpdate(
    sectionId,
    { $push: { subSection: newSubSection._id } },
    { new: true }
  );
  if (!updatedSection) {
    throw new apiError(400, "invalid sectionId");
  }
  const populatedCourse=await Course.findById(courseId).populate({path:"courseContent",populate:{path:"subSection"}})
  
  res
    .status(200)
    .json(
      new apiResponse(200, populatedCourse, "subSection created successfully")
    );
});

// *update a subSection controller
export const updateSubSection = asyncHandler(async (req, res) => {
  const { title, description, subSectionId, courseId } = req.body;
  const localPath = req?.file?.path;
  const data = {};
  if (title) {
    data.title = title;
  }
  if (description) {
    data.description = description;
  }
  if (localPath) {
    const videoUrl = await uploadOnCloudinary(localPath);
    if (!videoUrl) {
      throw new apiError(
        500,
        "error occurred while uploading video to cloudinary"
      );
    }
    data.video = videoUrl;
  }
  const updatedSubSection = await SubSection.findByIdAndUpdate(
    subSectionId,
    data,
    { new: true }
  );
  if (!updatedSubSection) {
    throw new apiError(400, "invalid subSectionId");
  }
  const populatedCourse=await Course.findById(courseId).populate({path:"courseContent",populate:{path:"subSection"}})

  res
    .status(200)
    .json(
      new apiResponse(200, populatedCourse, "subSection updated successfully")
    );
});

// *delete a subsection
export const deleteSubSection = asyncHandler(async (req, res) => {
  const { subSectionId,courseId } = req.body;
  if (!subSectionId || !courseId) {
    throw new apiError(400, "please provide subSectionId");
  }
  const deletedSubSection = await SubSection.findByIdAndDelete(subSectionId);
  if (!deletedSubSection) {
    throw new apiError(400, "invalid subSectionId");
  }
    const populatedCourse=await Course.findById(courseId).populate({path:"courseContent",populate:{path:"subSection"}})

  res
    .status(200)
    .json(new apiResponse(200, populatedCourse, "subSection deleted successfully"));
});

// *send a course
export const sendCourseDetail = asyncHandler(async (req, res) => {
  const { courseId } = req.body;

  const course = await Course.findById(courseId)
    .populate({
      path: "instructor",
      populate: {
        path: "profile",
      },
    })
    .populate("category")
    .populate("ratingAndReviews")
    .populate({
      path: "courseContent",
      populate: {
        path: "subSection",
      },
    })
    .exec();
  if (!course) {
    throw new apiError(400, "course not found");
  }
  res
    .status(200)
    .json(new apiResponse(200, course, "course sent successfully"));
});

// *send course detail for free access
export const halfCourseDetail=asyncHandler(async(req,res)=>{
  const {courseId}=req.body
  const course=await Course.findById(courseId).populate({
    path: "courseContent",
    populate: {
      path: "subSection",
      select:"-video"
    },
  }).populate("ratingAndReviews")
  .populate({
    path:"instructor",
    select:"firstName lastName"
  })
  if(!course){
    throw new apiError(400,"invalid courseId")
  }
  res.status(200).json(new apiResponse(200,course,"data send successfully"))
})

// *create ratingAndReview
export const createRatingAndReview = asyncHandler(async (req, res) => {
  const { courseId, rating, review } = req.body;
  const userId = req.authPayload._id;
  if (!courseId || !userId || !rating || !review) {
    throw new apiError(400, "please provide all the details");
  }
  const course = await Course.findById(courseId);
  if (!course) {
    throw new apiError(400, "invalid courseId");
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new apiError(400, "invalid userId");
  }
  const isStudentEnrolled = course.studentsEnrolled.some((val) =>
    val.equals(userId)
  );
  if (!isStudentEnrolled) {
    throw new apiError(
      400,
      "student is not enrolled"
    );
  }
  const alreadyReviewed = await RatingAndReviews.findOne({
    user: userId,
    course: courseId,
  });
  if (alreadyReviewed) {
    throw new apiError(400, "user have already given review");
  }
  const newRatingAndReview = await RatingAndReviews.create({
    user: userId,
    rating,
    review,
    course: courseId,
  });
  if (!newRatingAndReview) {
    throw new apiError(500, "unable to create rating and review");
  }
  course.ratingAndReviews.push(newRatingAndReview);
  course.save({ validateBeforeSave: false });
  res
    .status(200)
    .json(new apiResponse(200, {}, "ratingAndReview created successfully"));
});

// *send all rating and review
export const sendAllRatingAndReview = asyncHandler(async (req, res) => {
  const allRatingAndReview = await RatingAndReviews.find().limit(8)
    .populate({path:"user",
      select:"firstName lastName email userImage"
    })

  res
    .status(200)
    .json(
      new apiResponse(
        200,
        allRatingAndReview,
        "all ratingAndReview send successfully"
      )
    );
});

// *send course specific ratingAndReview
export const ratingAndReviews = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  if (!courseId) {
    throw new apiError(400, "please provide courseId");
  }
  const ratingAndReview = await RatingAndReviews.find({ course: courseId })
    .populate("user")
    .exec();
  res
    .status(200)
    .json(
      new apiResponse(
        200,
        ratingAndReview,
        "rating and reviews send successfully"
      )
    );
});

// *create a category
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    throw new apiError(400, "both name and description fields are mandatory");
  }
  const newCategory = await Category.create({
    name,
    description,
  });
  if (!newCategory) {
    throw new apiError(500, "unable to create category");
  }
  res
    .status(200)
    .json(new apiResponse(200, newCategory, "category created successfully"));
});

// *send all category details
export const sendAllCategories = asyncHandler(async (req, res) => {
  const allCategory = await Category.find().populate("course").exec();
  res
    .status(200)
    .json(new apiResponse(200, allCategory, "categories send successfully"));
});

//* send only categories
export const sendOnlyCategories = asyncHandler(async (req, res) => {
  const onlyCategories = await Category.find().select("name");
  res
    .status(200)
    .json(new apiResponse(200, onlyCategories, "categories send successfully"));
});

// *send specific and related category data
export const sendCategory = asyncHandler(async (req, res) => {
  const { categoryName } = req.body;
  // console.log("data received",req.body);
  
  if (!categoryName) {
    throw new apiError(400, "please provide categoryName");
  }
  const categoryData = await Category.findOne({name:categoryName})
    .populate({path:"course",
      select:"thumbnail title price ratingAndReviews",
      populate:{path:"ratingAndReviews"}
    })

  if (!categoryData) {
    throw new apiError(400, "invalid categoryName");
  }
  const otherCategoryData = await Course.find({$and:[{status:"Published"},{category: { $ne: categoryData._id} }]}).limit(5).select("thumbnail title price ratingAndReviews").populate("ratingAndReviews")

  const topSellingCourses = await Course.find({status:"Published"}).sort({ studentsEnrolled: -1 }).limit(5).select("thumbnail title price ratingAndReviews").populate("ratingAndReviews");
  const data = { categoryData, otherCategoryData, topSellingCourses };
  res
    .status(200)
    .json(new apiResponse(200, data, "categories data send successfully"));
});

export const enrolledCourses=asyncHandler(async(req,res)=>{
    const courses=await User.findById(req.authPayload._id).select("courses").populate("courses").exec()
    res.status(200).json(new apiResponse(200,courses,"all enrolled courses"))
})

export const getCartItems=asyncHandler(async(req,res)=>{
    const cartItems=await User.findById(req.authPayload._id).select("cart").populate({path:"cart",populate:[{path:"instructor"},{path:"ratingAndReviews",select:"rating review"}]})
    res.status(200).json(new apiResponse(200,cartItems,"cart send successfully"))
})

export const addItemToCart=asyncHandler(async(req,res)=>{
    const {courseId}=req.body
    if(!courseId){
        throw new apiError(400,"please provide courseId")
    }
    const user=await User.findById(req.authPayload._id)
    if(user.cart.some((eachCourse)=>eachCourse.toString()===courseId)){
      throw new apiError(400,"Course already exists in cart")
    }
    const newCart=await User.findByIdAndUpdate(
        req.authPayload._id,
        {$addToSet:{cart:courseId}},
        {new:true}
    )
    res.status(200).json(new apiResponse(200,newCart,"course added to cart"))
})

export const removeItemFromCart=asyncHandler(async(req,res)=>{
    const {courseId}=req.body
    if(!courseId){
        throw new apiError(400,"please provide courseId")
    }
    const newCart=await User.findByIdAndUpdate(
        req.authPayload._id,
        {$pull:{cart:courseId}},
        {new:true}
    )
    res.status(200).json(new apiResponse(200,newCart,"course removed from cart"))
})

export const publishCourse=asyncHandler(async(req,res)=>{
  const {courseId}=req.body
  if(!courseId){
    throw new apiError(400,"please provide courseId")
  }
  const response=await Course.findByIdAndUpdate(courseId,{status:"Published"},{new:true})
  if(!response){
    throw new apiError(400,"invalid courseId")
  }
  await Category.findByIdAndUpdate(response.category,{$push:{course:courseId}})
  res.status(200).json(new apiResponse(200,{},"course published"))
})

export const draftCourse=asyncHandler(async(req,res)=>{
  const {courseId}=req.body
  if(!courseId){
    throw new apiError(400,"please provide courseId")
  }
  const response=await Course.findByIdAndUpdate(courseId,{status:"Draft"})
  if(!response){
    throw new apiError(400,"invalid courseId")
  }
  res.status(200).json(new apiResponse(200,{},"course drafted"))
})

// *courses that student have bought
export const studentEnrolledCourses=asyncHandler(async(req,res)=>{
  const courses=await User.findById(req.authPayload._id).select("courses").populate({
    path:"courses",
    populate:{path:"courseContent",populate:{path:"subSection"}}
  })
  if(!courses){
    throw new apiError(400,"invalid userId")
  }
  res.status(200).json(new apiResponse(200,courses,"courses send successfully"))
  
})

// *view course data
export const viewCourseData=asyncHandler(async(req,res)=>{
  const {courseId}=req.body
  if(!courseId){
    throw new apiError(400,"please provide courseId")
  }
  const course=await Course.findById(courseId).populate({path:"courseContent",
    populate:{path:"subSection"}
  })
  if(!course){
    throw new apiError(400,"invalid courseId")
  }
  res.status(200).json(new apiResponse(200,course,"course detail send successfully"))
})

// *instructor dashboard data
export const dashboardData=asyncHandler(async(req,res)=>{
  const courses=await Course.find({$and:[{instructor:req.authPayload._id},{status:"Published"}]}).select("title price studentsEnrolled thumbnail instructor").populate({path:"instructor",select:"firstName lastName"})
  if(!courses){
    throw new apiError(400,"invalid userId")
  }
  res.status(200).json(new apiResponse(200,courses,"data send successfully"))
})

// TODO: for future add a mark completed functionality through which user knows that he has watched this video
// mark lecture as completed
// export const videoCompleted=asyncHandler(async(req,res)=>{
//   const {courseId,subSectionId}=req.body
//   if(!courseId || !subSectionId){
//     throw new apiError(400,"please provide all the details")
//   }
//   const course=await Course.findById(courseId).populate({
//     path:"courseContent",
//     populate:{path:"subSection"}
//   })
//   if(!course){
//     throw new apiError(400,"invalid course id")
//   }
//   const isSubSectionValid=course.courseContent.some((section)=>section.subSection.some((eachSubSection)=>eachSubSection._id.toString()===subSectionId))
//   if(!isSubSectionValid){
//     throw new apiError(400,"invalid subSectionId")
//   }
  
//   const user=await User.findById(req.authPayload._id).populate("courseProgress")
//   const courseProgress=user.courseProgress.find((cp)=>cp.courseId.toString()===courseId)
//   if(courseProgress){
//     courseProgress.completedVideos.push(subSectionId)
//     await courseProgress.save({validateBeforeSave:false})
//   }
//   else{
//     const courseProgressDoc=await CourseProgress.create({
//       courseId,
//       completedVideos:[subSectionId]
//     })
//     user.courseProgress.push(courseProgressDoc._id)
//     await user.save()
//   }
// })
