import { Order, Feedback, Question } from '@/lib/types'
import { generateOrders, generateFeedbacks, generateQuestions } from './generator'

// Singleton in-memory store (resets on cold start — fine for MVP/demo)
let _orders: Order[] | null = null
let _feedbacks: Feedback[] | null = null
let _questions: Question[] | null = null

export function getOrders(): Order[] {
  if (!_orders) _orders = generateOrders(300)
  return _orders
}

export function getFeedbacks(): Feedback[] {
  if (!_feedbacks) _feedbacks = generateFeedbacks(getOrders())
  return _feedbacks
}

export function getQuestions(): Question[] {
  if (!_questions) _questions = generateQuestions(getOrders())
  return _questions
}

export function updateFeedbackReply(id: string, replyText: string): Feedback | null {
  const feedbacks = getFeedbacks()
  const fb = feedbacks.find(f => f.id === id)
  if (!fb) return null
  fb.replied = true
  fb.replyText = replyText
  return fb
}

export function updateQuestionAnswer(id: string, answer: string): Question | null {
  const questions = getQuestions()
  const q = questions.find(q => q.id === id)
  if (!q) return null
  q.answered = true
  q.answer = answer
  return q
}
