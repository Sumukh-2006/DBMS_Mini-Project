// lib/aggregations.js
// MongoDB Aggregation Pipelines fulfilling Section 11.3 of the specification:
// 1. Average rating per company by category ($match, $group, $project, $sort)
// 2. Most frequent skills in resumes ($unwind, $group, $sort)
// 3. Feedback rubric averages ($group, $objectToArray, $avg)
// 4. Activity heatmap by weekday/hour ($project date operators, $group)
// 5. Top review tags and sentiment ($unwind, $group, $sort)

const { getMongoDb } = require('./mongo');

/**
 * 1. Average Rating per Company by Category
 */
async function getCompanyRatingAverages() {
  const db = await getMongoDb();
  return db.collection('experience_reviews').aggregate([
    {
      $group: {
        _id: '$company_name',
        company_id: { $first: '$company_id' },
        avg_mentorship: { $avg: '$ratings.mentorship' },
        avg_learning: { $avg: '$ratings.learning' },
        avg_work_life: { $avg: '$ratings.work_life_balance' },
        avg_compensation: { $avg: '$ratings.compensation' },
        total_reviews: { $sum: 1 }
      }
    },
    {
      $project: {
        company_name: '$_id',
        company_id: 1,
        avg_mentorship: { $round: ['$avg_mentorship', 2] },
        avg_learning: { $round: ['$avg_learning', 2] },
        avg_work_life: { $round: ['$avg_work_life', 2] },
        avg_compensation: { $round: ['$avg_compensation', 2] },
        overall_score: {
          $round: [
            {
              $avg: [
                '$avg_mentorship',
                '$avg_learning',
                '$avg_work_life',
                '$avg_compensation'
              ]
            },
            2
          ]
        },
        total_reviews: 1
      }
    },
    { $sort: { overall_score: -1 } }
  ]).toArray();
}

/**
 * 2. Most Frequent Skills Extracted from Resumes (Skill Supply Analysis)
 */
async function getResumeSkillsFrequency() {
  const db = await getMongoDb();
  return db.collection('resumes').aggregate([
    { $unwind: '$extracted_skills' },
    {
      $group: {
        _id: '$extracted_skills',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        skill: '$_id',
        frequency: '$count',
        _id: 0
      }
    },
    { $sort: { frequency: -1 } },
    { $limit: 15 }
  ]).toArray();
}

/**
 * 3. Dynamic Interview Feedback Rubric Averages
 * Unpacks varying evaluation rubric keys dynamically with $objectToArray
 */
async function getInterviewFeedbackAverages() {
  const db = await getMongoDb();
  return db.collection('interview_feedback').aggregate([
    {
      $project: {
        interview_id: 1,
        rubricArray: { $objectToArray: '$rubric' }
      }
    },
    { $unwind: '$rubricArray' },
    {
      $group: {
        _id: '$rubricArray.k',
        average_score: { $avg: '$rubricArray.v' },
        evaluations_count: { $sum: 1 }
      }
    },
    {
      $project: {
        metric: '$_id',
        average_score: { $round: ['$average_score', 2] },
        evaluations_count: 1,
        _id: 0
      }
    },
    { $sort: { average_score: -1 } }
  ]).toArray();
}

/**
 * 4. Activity Heatmap by Day of Week and Hour
 */
async function getActivityHeatmap() {
  const db = await getMongoDb();
  return db.collection('activity_logs').aggregate([
    {
      $project: {
        dayOfWeek: { $dayOfWeek: '$ts' },
        hour: { $hour: '$ts' },
        action: 1
      }
    },
    {
      $group: {
        _id: { day: '$dayOfWeek', hour: '$hour' },
        total_events: { $sum: 1 },
        actions: { $push: '$action' }
      }
    },
    {
      $project: {
        day_of_week: '$_id.day',
        hour_of_day: '$_id.hour',
        total_events: 1,
        _id: 0
      }
    },
    { $sort: { day_of_week: 1, hour_of_day: 1 } }
  ]).toArray();
}

/**
 * 5. Top Review Tags Analysis
 */
async function getTopReviewTags() {
  const db = await getMongoDb();
  return db.collection('experience_reviews').aggregate([
    { $unwind: '$tags' },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        tag: '$_id',
        count: 1,
        _id: 0
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]).toArray();
}

module.exports = {
  getCompanyRatingAverages,
  getResumeSkillsFrequency,
  getInterviewFeedbackAverages,
  getActivityHeatmap,
  getTopReviewTags,
};
