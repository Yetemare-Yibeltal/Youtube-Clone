import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import {
  getSubscriptionStatus,
  toggleSubscription
} from '../../api/subscription.api'
import { selectIsAuthenticated } from '../../features/auth/authSlice'

export default function SubscribeButton ({
  channelId,
  isOwnChannel,
  initialSubscribed = false,
  onChange
}) {
  const navigate = useNavigate()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || isOwnChannel || !channelId) return
    getSubscriptionStatus(channelId)
      .then(data => setIsSubscribed(data.subscribed))
      .catch(() => {})
  }, [channelId, isAuthenticated, isOwnChannel])

  if (isOwnChannel) return null

  async function handleClick () {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    setIsLoading(true)
    try {
      const data = await toggleSubscription(channelId)
      setIsSubscribed(data.subscribed)
      onChange?.(data)
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Could not update subscription'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (

  )
}
