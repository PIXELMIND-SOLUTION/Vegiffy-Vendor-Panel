import { useState, useEffect, useRef } from "react";
import { 
  RiMenu2Line, 
  RiMenu3Line, 
  RiFullscreenLine, 
  RiFullscreenExitLine,
  RiStore2Line,
  RiBankCardLine,
  RiTimeLine,
  RiWalletLine,
  RiRefreshLine,
  RiNotification3Line,
  RiNotification2Fill
} from "react-icons/ri";
import {
  FaTimes,
  FaCheck,
  FaTimesCircle,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaReceipt,
  FaCreditCard,
  FaCalendarAlt,
  FaBell,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTruck,
  FaShoppingCart,
  FaBox
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ─────────────────────────────────────────────────────────────────────────────
// EXTRACTED: Defined OUTSIDE Navbar so React never unmounts/remounts them.
// Previously these were defined inside Navbar, which meant they were brand-new
// component types on every render → React unmounted + remounted → flicker.
// ─────────────────────────────────────────────────────────────────────────────

const ErrorPopup = ({
  showErrorPopup,
  errorMessage,
  setShowErrorPopup,
}) => {
  if (!showErrorPopup) return null;
  const isDeliveryBoyError =
    errorMessage.includes("No delivery boys found") ||
    errorMessage.includes("all are busy");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
        <div className={`rounded-t-3xl p-6 ${isDeliveryBoyError ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-gradient-to-r from-red-500 to-pink-500"}`}>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              {isDeliveryBoyError ? (
                <FaTruck className="text-white text-2xl" />
              ) : (
                <FaExclamationTriangle className="text-white text-2xl" />
              )}
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">
                {isDeliveryBoyError ? "Delivery Issue" : "Order Failed"}
              </h3>
              <p className="text-white text-sm opacity-90">
                {isDeliveryBoyError ? "No delivery boy available" : "Unable to process order"}
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 font-medium mb-2">Error Message:</p>
            <div className={`p-4 rounded-xl ${isDeliveryBoyError ? "bg-orange-50 border border-orange-200" : "bg-red-50 border border-red-200"}`}>
              <p className={isDeliveryBoyError ? "text-orange-800" : "text-red-800"}>{errorMessage}</p>
            </div>
          </div>
          {isDeliveryBoyError && (
            <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start space-x-2">
                <FaInfoCircle className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-800 font-medium mb-1">What you can do:</p>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc pl-4">
                    <li>Order will stay pending until a delivery boy is available</li>
                    <li>You can try again in a few minutes</li>
                    <li>Customer will be notified about the delay</li>
                    <li>System automatically retries every minute</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          <div className="flex space-x-3">
            <button
              onClick={() => setShowErrorPopup(false)}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl transition-colors"
            >
              Dismiss
            </button>
            {isDeliveryBoyError && (
              <button
                onClick={() => setShowErrorPopup(false)}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
              >
                View Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const BufferOrderModal = ({
  showBuffer,
  currentBufferOrder,
  bufferOrders,
  isPlayingSound,
  isProcessingOrder,
  handleCloseBuffer,
  handleNextOrder,
  handleAcceptOrder,
  handleRejectOrder,
}) => {
  if (!showBuffer || !currentBufferOrder) return null;

  const order = currentBufferOrder;
  const user = order.userId || {};
  const address = order.deliveryAddress || {};
  const orderTime = new Date(order.createdAt || new Date()).toLocaleString();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[150] p-4">
      <div
        className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl max-w-2xl w-full"
        style={{ animation: "bounceInModal 0.5s ease-out" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-t-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white bg-opacity-20 rounded-full -mr-12 -mt-12" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-20 rounded-full -ml-8 -mb-8" />
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${isPlayingSound ? "bg-red-500 animate-ping" : "bg-green-400"}`} />
              <div>
                <h3 className="text-white font-bold text-2xl">🎊 New Order Alert!</h3>
                <p className="text-yellow-100 text-sm mt-1">Time to cook something delicious!</p>
              </div>
            </div>
            <button
              onClick={handleCloseBuffer}
              disabled={isProcessingOrder}
              className="text-white hover:text-yellow-200 bg-white bg-opacity-20 p-2 rounded-full transition-colors"
            >
              <FaTimes size={20} />
            </button>
          </div>
          {isProcessingOrder && (
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-t-3xl">
              <div className="bg-white rounded-lg px-4 py-2 shadow-lg flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                <span className="text-sm font-medium text-gray-700">Processing...</span>
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-lg p-5 mb-5 border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xl font-bold text-gray-800 flex items-center">
                  <FaReceipt className="mr-2 text-blue-500" />
                  Order #{order._id?.slice(-8).toUpperCase() || "N/A"}
                </h4>
                <p className="text-gray-500 text-sm flex items-center mt-1">
                  <FaCalendarAlt className="mr-1" />{orderTime}
                </p>
              </div>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                ⏰ Pending
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-semibold text-gray-800 flex items-center">
                  <FaCreditCard className="mr-2 text-green-500" />{order.paymentMethod || "Online"}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Payment Status</p>
                <p className="font-semibold text-green-600">
                  {order.paymentStatus === "Paid" ? "✅ Paid" : "Pending"}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-white rounded-2xl shadow-lg p-5 mb-5 border border-gray-100">
            <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaUser className="mr-2 text-purple-500" />Customer Details
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <FaUser className="text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer Name</p>
                  <p className="font-semibold text-gray-800">{user.firstName} {user.lastName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaPhone className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="font-semibold text-gray-800">{user.phoneNumber || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <FaEnvelope className="text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Email Address</p>
                  <p className="font-semibold text-gray-800 truncate">{user.email || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-2xl shadow-lg p-5 mb-5 border border-gray-100">
            <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaMapMarkerAlt className="mr-2 text-red-500" />Delivery Address
            </h5>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-800">{address.street || "N/A"}</p>
              <p className="text-gray-600 mt-1">{address.city}, {address.state} - {address.postalCode}</p>
              <p className="text-gray-600">{address.country}</p>
              <span className="inline-block mt-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                {address.addressType || "Home"}
              </span>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-2xl shadow-lg p-5 mb-5 border border-gray-100">
            <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaShoppingCart className="mr-2 text-orange-500" />
              Order Items ({order.products?.length || 0})
            </h5>
            <div className="space-y-3 max-h-56 overflow-y-auto">
              {order.products?.length > 0 ? (
                order.products.map((item, i) => (
                  <div key={i} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                      onError={(e) => {
                        e.target.src = "https://static.vecteezy.com/system/resources/previews/000/273/542/original/online-food-order-concept-vector.jpg";
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">₹{item.price}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <FaBox className="text-3xl text-gray-300 mx-auto mb-2" />
                  <p>No item details available</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Total */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-5 text-white">
            <h5 className="text-lg font-semibold mb-4 flex items-center">
              <FaReceipt className="mr-2" />Order Summary
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal ({order.totalItems || 0} items):</span>
                <span className="font-semibold">₹{order.subTotal || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge:</span>
                <span className="font-semibold">₹{order.deliveryCharge || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Amount:</span>
                <span className="font-semibold">₹{order.gstAmount || 0}</span>
              </div>
              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-green-300">
                  <span>Coupon Discount:</span>
                  <span className="font-semibold">-₹{order.couponDiscount}</span>
                </div>
              )}
              <div className="border-t border-white border-opacity-30 pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-yellow-300">₹{order.totalPayable || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 mt-6">
            <button
              onClick={() => handleRejectOrder(order._id)}
              disabled={isProcessingOrder}
              className={`flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center space-x-3 ${isProcessingOrder ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <FaTimesCircle size={18} /><span>Reject Order</span>
            </button>
            <button
              onClick={() => handleAcceptOrder(order._id)}
              disabled={isProcessingOrder}
              className={`flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center space-x-3 ${isProcessingOrder ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <FaCheck size={18} /><span>Accept Order</span>
            </button>
          </div>

          {/* Next Order Navigation */}
          {bufferOrders.length > 1 && (
            <div className="text-center mt-4">
              <button
                onClick={handleNextOrder}
                disabled={isProcessingOrder}
                className={`text-blue-600 hover:text-blue-800 font-medium text-sm bg-blue-50 px-4 py-2 rounded-full transition-colors ${isProcessingOrder ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                ↪ Next Order ({bufferOrders.length - 1} more waiting)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────────────────────────────────────
const Navbar = ({ setIsCollapsed, isCollapsed }) => {
  const [vendorStatus, setVendorStatus] = useState("active");
  const [isLoading, setIsLoading] = useState(false);
  const [vendorId, setVendorId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [vendorImage, setVendorImage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [greeting, setGreeting] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const [prevNotificationCount, setPrevNotificationCount] = useState(0);
  const [isPlayingNotificationSound, setIsPlayingNotificationSound] = useState(false);
  const [statusToast, setStatusToast] = useState(null);

  // Order Buffer State
  const [bufferOrders, setBufferOrders] = useState([]);
  const [currentBufferOrder, setCurrentBufferOrder] = useState(null);
  const [showBuffer, setShowBuffer] = useState(false);
  const [isBufferManuallyClosed, setIsBufferManuallyClosed] = useState(false);
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPollingActive, setIsPollingActive] = useState(true);

  const navigate = useNavigate();
  const notificationSoundRef = useRef(null);
  const orderAudioRef = useRef(null);
  const notificationCheckInterval = useRef(null);
  const statusRefreshInterval = useRef(null);
  const bufferIntervalRef = useRef(null);
  const bufferOrdersRef = useRef([]);
  const isBufferManuallyClosedRef = useRef(false);
  const currentBufferOrderRef = useRef(null);
  const isPollingActiveRef = useRef(true);

  // Sync refs
  useEffect(() => { bufferOrdersRef.current = bufferOrders; }, [bufferOrders]);
  useEffect(() => { isBufferManuallyClosedRef.current = isBufferManuallyClosed; }, [isBufferManuallyClosed]);
  useEffect(() => { currentBufferOrderRef.current = currentBufferOrder; }, [currentBufferOrder]);
  useEffect(() => { isPollingActiveRef.current = isPollingActive; }, [isPollingActive]);

  // Bootstrap
  useEffect(() => {
    const storedVendorId = localStorage.getItem("vendorId");
    const storedVendorData = localStorage.getItem("vendorData");

    if (storedVendorId) {
      setVendorId(storedVendorId);
      fetchVendorStatus(storedVendorId);
      fetchVendorProfile(storedVendorId);
      fetchNotificationCount(storedVendorId);
    }

    if (storedVendorData) {
      try {
        const vendorData = JSON.parse(storedVendorData);
        setVendorName(vendorData.restaurantName);
      } catch (_) {}
    }

    updateTimeAndGreeting();
    const timeInterval = setInterval(updateTimeAndGreeting, 60000);

    notificationCheckInterval.current = setInterval(() => {
      const id = localStorage.getItem("vendorId");
      if (id) fetchNotificationCount(id);
    }, 120000);

    if (storedVendorId) {
      statusRefreshInterval.current = setInterval(() => {
        fetchVendorStatus(storedVendorId);
        fetchVendorProfile(storedVendorId);
      }, 30000);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const id = localStorage.getItem("vendorId");
        if (id) {
          fetchVendorStatus(id);
          fetchVendorProfile(id);
          fetchNotificationCount(id);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(timeInterval);
      if (notificationCheckInterval.current) clearInterval(notificationCheckInterval.current);
      if (statusRefreshInterval.current) clearInterval(statusRefreshInterval.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Order buffer polling
  useEffect(() => {
    if (!vendorId) return;

    if (isPollingActive) fetchRestaurantOrders(vendorId);

    bufferIntervalRef.current = setInterval(() => {
      if (
        isPollingActiveRef.current &&
        !currentBufferOrderRef.current &&
        bufferOrdersRef.current.length === 0
      ) {
        fetchRestaurantOrders(vendorId);
      }
    }, 2000);

    return () => {
      if (bufferIntervalRef.current) clearInterval(bufferIntervalRef.current);
    };
  }, [vendorId]);

  // Auto-hide status toast
  useEffect(() => {
    if (statusToast) {
      const t = setTimeout(() => setStatusToast(null), 2000);
      return () => clearTimeout(t);
    }
  }, [statusToast]);

  // Helpers
  const updateTimeAndGreeting = () => {
    const now = new Date();
    const h = now.getHours();
    if (h < 12) setGreeting("🌅 Good Morning");
    else if (h < 17) setGreeting("☀️ Good Afternoon");
    else setGreeting("🌙 Good Evening");
    setCurrentTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }));
  };

  const speakText = (text) => {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0; utterance.pitch = 1.0; utterance.volume = 1.0;
    const voices = speechSynthesis.getVoices();
    const femaleVoice = voices.find(
      (v) => v.name.includes("Female") || v.name.includes("female") || v.lang.includes("en-US") || v.lang.includes("en-IN")
    );
    if (femaleVoice) utterance.voice = femaleVoice;
    speechSynthesis.speak(utterance);
  };

  const playOrderNotificationSound = () => {
    if (orderAudioRef.current) {
      orderAudioRef.current.currentTime = 0;
      orderAudioRef.current.play().catch(() => {});
      setIsPlayingSound(true);
      setTimeout(() => setIsPlayingSound(false), 2000);
    }
    setTimeout(() => speakText("You have a new order. Please check!"), 300);
  };

  const fetchVendorProfile = async (id) => {
    if (!id) return;
    try {
      const response = await axios.get(`https://api.vegiffy.in/api/profile/${id}`);
      if (response.data.success && response.data.data) {
        const d = response.data.data;
        if (d.restaurantName) setVendorName(d.restaurantName);
        if (d.image) {
          setVendorImage(typeof d.image === "string" ? d.image : d.image.url || "");
        } else {
          setVendorImage("");
        }
        localStorage.setItem("vendorData", JSON.stringify({
          restaurantName: d.restaurantName,
          image: d.image,
          email: d.email,
          mobile: d.mobile,
        }));
      }
    } catch (_) {}
  };

  const fetchVendorStatus = async (id) => {
    if (!id) return;
    try {
      const response = await axios.get(`https://api.vegiffy.in/api/vendor/vendorstatus/${id}`);
      if (response.data.success) {
        const s = response.data.status || response.data.vendor?.status;
        if (s) setVendorStatus(s);
      }
    } catch (_) {}
  };

  const fetchNotificationCount = async (id) => {
    try {
      const res = await fetch(`https://api.vegiffy.in/api/vendor/notification/${id}`);
      const result = await res.json();
      if (result.success) {
        const unread = result.data?.filter((n) => !n.isRead)?.length || 0;
        if (unread > prevNotificationCount) playNavNotificationSound();
        setPrevNotificationCount(unread);
        setNotificationCount(unread);
      }
    } catch (_) {}
  };

  const playNavNotificationSound = () => {
    if (notificationSoundRef.current) {
      notificationSoundRef.current.play().catch(() => playFallbackSound());
      setIsPlayingNotificationSound(true);
      speakNotificationText();
      setTimeout(() => setIsPlayingNotificationSound(false), 2000);
    } else {
      playFallbackSound();
    }
  };

  const playFallbackSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (_) {}
  };

  const speakNotificationText = () => {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance("You have a new notification. Please check!");
    utterance.rate = 1.0; utterance.pitch = 1.0; utterance.volume = 0.8;
    const voices = speechSynthesis.getVoices();
    const v = voices.find((v) => v.name.includes("Female") || v.name.includes("female") || v.lang.includes("en-US") || v.lang.includes("en-IN"));
    if (v) utterance.voice = v;
    speechSynthesis.cancel();
    setTimeout(() => speechSynthesis.speak(utterance), 500);
  };

  const toggleVendorStatus = async () => {
    if (!vendorId) return;
    setIsLoading(true);
    const newStatus = vendorStatus === "active" ? "inactive" : "active";
    try {
      const res = await axios.put(`https://api.vegiffy.in/api/vendor/vendorstatus/${vendorId}`, { status: newStatus });
      if (res.data.success) {
        setVendorStatus(newStatus);
        setStatusToast(
          newStatus === "active"
            ? "✅ Vendor Status: ACTIVE - Your store is now online!"
            : "⛔ Vendor Status: INACTIVE - Your store is now offline!"
        );
      }
    } catch (_) {
      setStatusToast("❌ Failed to update vendor status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false));
    }
  };

  const handleNotificationClick = () => {
    setNotificationCount(0);
    setPrevNotificationCount(0);
    navigate("/notification");
  };

  // ── Order buffer logic ─────────────────────────────────────────────────────
  const fetchRestaurantOrders = async (id) => {
    try {
      const res = await axios.get(`https://api.vegiffy.in/api/vendor/restaurantorders/${id}`);
      const allOrders = res.data.data || res.data || [];
      const pending = allOrders.filter(
        (o) => o.orderStatus === "Pending" || o.orderStatus === "pending"
      );

      if (pending.length > 0) {
        const incomingIds = pending.map((o) => o._id).join(",");
        const currentIds = bufferOrdersRef.current.map((o) => o._id).join(",");

        if (incomingIds !== currentIds) {
          const isFirstBatch = bufferOrdersRef.current.length === 0;
          setBufferOrders(pending);
          setHasNewOrders(true);

          if (isFirstBatch && !isBufferManuallyClosedRef.current) {
            setIsPollingActive(false);
            setShowBuffer(true);
            playOrderNotificationSound();
            setCurrentBufferOrder((prev) => prev ?? pending[0]);
          }
        }
      } else {
        if (bufferOrdersRef.current.length > 0) {
          setBufferOrders([]);
          setCurrentBufferOrder(null);
          setShowBuffer(false);
          setHasNewOrders(false);
        }
        setIsPollingActive((prev) => (prev ? prev : true));
      }
    } catch (_) {}
  };

  const handleAcceptOrder = async (orderId) => {
    if (!vendorId) return;
    try {
      setIsProcessingOrder(true);
      const res = await axios.put(
        `https://api.vegiffy.in/api/acceptorder/${orderId}/${vendorId}`,
        { orderStatus: "Accepted" }
      );
      if (res.data.success) {
        removeOrderFromBuffer(orderId);
        speakText("Order accepted successfully!");
      } else {
        const msg = res.data.message || "Failed to accept order";
        setErrorMessage(msg);
        setShowErrorPopup(true);
        speakText(msg);
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Network error. Please check your connection.";
      setErrorMessage(msg);
      setShowErrorPopup(true);
      speakText(msg);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleRejectOrder = async (orderId) => {
    if (!vendorId) return;
    try {
      setIsProcessingOrder(true);
      const res = await axios.put(
        `https://api.vegiffy.in/api/acceptorder/${orderId}/${vendorId}`,
        { orderStatus: "Rejected" }
      );
      if (res.data.success) {
        removeOrderFromBuffer(orderId);
        speakText("Order rejected.");
      } else {
        const msg = res.data.message || "Failed to reject order";
        setErrorMessage(msg);
        setShowErrorPopup(true);
        speakText(msg);
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Network error. Please check your connection.";
      setErrorMessage(msg);
      setShowErrorPopup(true);
      speakText(msg);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const removeOrderFromBuffer = (orderId) => {
    setBufferOrders((prev) => {
      const updated = prev.filter((o) => o._id !== orderId);
      if (updated.length > 0) {
        setCurrentBufferOrder((cur) =>
          !cur || cur._id === orderId ? updated[0] : cur
        );
        setShowBuffer(true);
        setIsPollingActive(false);
      } else {
        setCurrentBufferOrder(null);
        setShowBuffer(false);
        setHasNewOrders(false);
        setIsPollingActive(true);
      }
      return updated;
    });
  };

  const handleNextOrder = () => {
    if (!currentBufferOrder || bufferOrders.length === 0) return;
    const idx = bufferOrders.findIndex((o) => o._id === currentBufferOrder._id);
    const next = (idx + 1) % bufferOrders.length;
    setCurrentBufferOrder(bufferOrders[next]);
  };

  const handleCloseBuffer = () => {
    setShowBuffer(false);
    setIsBufferManuallyClosed(true);
    if (bufferOrders.length === 0) setIsPollingActive(true);
  };

  const handleOpenBuffer = () => {
    if (bufferOrders.length > 0) {
      setShowBuffer(true);
      setIsBufferManuallyClosed(false);
      if (!currentBufferOrder) setCurrentBufferOrder(bufferOrders[0]);
      setIsPollingActive(false);
    }
  };

  return (
    <>
      {/* Audio */}
      <audio ref={notificationSoundRef} preload="auto" src="https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3" />
      <audio ref={orderAudioRef} preload="auto" src="https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3" />

      {/* Modals — rendered as siblings to the navbar, not inside it */}
      <BufferOrderModal
        showBuffer={showBuffer}
        currentBufferOrder={currentBufferOrder}
        bufferOrders={bufferOrders}
        isPlayingSound={isPlayingSound}
        isProcessingOrder={isProcessingOrder}
        handleCloseBuffer={handleCloseBuffer}
        handleNextOrder={handleNextOrder}
        handleAcceptOrder={handleAcceptOrder}
        handleRejectOrder={handleRejectOrder}
      />
      <ErrorPopup
        showErrorPopup={showErrorPopup}
        errorMessage={errorMessage}
        setShowErrorPopup={setShowErrorPopup}
      />

      {/* Status Toast */}
      {statusToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] animate-bounce-in">
          <div className="bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border-l-4 border-green-500">
            <div className="text-sm font-medium">{statusToast}</div>
            <button onClick={() => setStatusToast(null)} className="text-gray-300 hover:text-white text-lg leading-none">✕</button>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-600 border-b border-green-500 sticky top-0 w-full px-5 py-3 flex items-center justify-between shadow-lg z-50">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-xl bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm transition-all duration-200 text-white hover:scale-105 shadow-md"
          >
            {isCollapsed ? <RiMenu2Line className="text-base" /> : <RiMenu3Line className="text-base" />}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm">
                <RiStore2Line className="text-white text-sm" />
              </div>
              <div className="text-white">
                <h2 className="font-bold text-sm tracking-wide truncate max-w-[150px]">{vendorName || "My Restaurant"}</h2>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${vendorStatus === "active" ? "bg-green-300" : "bg-red-300"}`} />
                  <span className="text-xs font-medium opacity-90">
                    {vendorStatus === "active" ? "Online • Active" : "Offline • Inactive"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleVendorStatus}
                disabled={isLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${vendorStatus === "active" ? "bg-green-300 hover:bg-green-200" : "bg-gray-300 hover:bg-gray-200"} ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer shadow-inner"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 shadow ${vendorStatus === "active" ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              {isLoading && <div className="w-3 h-3 border-t border-white border-solid rounded-full animate-spin" />}
            </div>
          </div>
        </div>

        {/* Center — Withdrawal Message */}
        <div className="flex-1 mx-6 flex justify-center">
          <div className="w-full max-w-2xl">
            <div className="relative group">
              <div className="flex items-center justify-center gap-3 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01]">
                <div className="relative">
                  <RiBankCardLine className="text-white text-base drop-shadow" />
                  <div className="absolute -inset-1 bg-purple-300 rounded-full blur opacity-30" />
                </div>
                <div className="text-center flex flex-col items-center px-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <RiRefreshLine className="text-white text-sm animate-spin-slow" />
                    <h1 className="text-white font-bold text-sm tracking-wide uppercase">Withdrawal Every</h1>
                    <RiRefreshLine className="text-white text-sm animate-spin-slow reverse" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RiTimeLine className="text-white text-xs" />
                    <p className="text-white font-semibold text-sm">
                      <span className="text-purple-100 font-bold mx-1 text-sm bg-white bg-opacity-15 px-1.5 py-0.5 rounded">72</span> Hours
                    </p>
                    <RiTimeLine className="text-white text-xs" />
                  </div>
                  <div className="mt-1 px-2 py-0.5 bg-white bg-opacity-15 rounded-full backdrop-blur-sm">
                    <p className="text-white text-xs font-medium">Next: <span className="font-bold text-purple-100">24h 36m</span></p>
                  </div>
                </div>
                <div className="relative">
                  <RiWalletLine className="text-white text-base drop-shadow" />
                  <div className="absolute -inset-1 bg-indigo-300 rounded-full blur opacity-30" />
                </div>
                <div className="absolute inset-0 rounded-xl border border-purple-300 border-opacity-40" />
              </div>
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-72 px-3 py-2 bg-gray-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 shadow-xl">
                <div className="text-center">
                  <h3 className="font-bold text-purple-300 text-sm mb-1">💡 Important Information</h3>
                  <p className="text-xs text-gray-200">You can withdraw your earnings once every 72 hours. This ensures secure transaction processing.</p>
                  <div className="mt-1.5 pt-1.5 border-t border-gray-700">
                    <p className="text-[10px] text-gray-300">Last withdrawal: <span className="font-bold text-green-300">24 hours ago</span></p>
                    <p className="text-[10px] text-gray-300">Next available: <span className="font-bold text-purple-300">24 hours from now</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {bufferOrders.length > 0 && (
            <button
              onClick={handleOpenBuffer}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 text-sm ${
                hasNewOrders && !showBuffer
                  ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white animate-pulse shadow-lg"
                  : "bg-white bg-opacity-20 text-white shadow-md hover:bg-opacity-30"
              }`}
            >
              <FaBell className={hasNewOrders && !showBuffer ? "animate-bounce" : ""} />
              <span>{hasNewOrders && !showBuffer ? "📢 New Orders!" : "Pending"}</span>
              <span className="bg-white text-orange-600 px-1.5 py-0.5 rounded-full text-xs font-bold ml-1">
                {bufferOrders.length}
              </span>
            </button>
          )}

          <div className="relative">
            <button
              onClick={handleNotificationClick}
              className="p-2 rounded-xl bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm transition-all duration-200 text-white hover:scale-105 shadow-md relative"
              title={notificationCount > 0 ? `${notificationCount} unread notifications` : "No notifications"}
            >
              {notificationCount > 0 ? (
                <>
                  <RiNotification2Fill className="text-sm" />
                  {isPlayingNotificationSound && (
                    <div className="absolute -top-1 -right-1 w-4 h-4">
                      <div className="absolute inset-0 bg-red-500 rounded-full animate-ping" />
                    </div>
                  )}
                </>
              ) : (
                <RiNotification3Line className="text-sm" />
              )}
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex flex-col items-end bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white border-opacity-20">
            <div className="text-white text-xs font-medium">{greeting}</div>
            <div className="text-white text-xs font-bold bg-white bg-opacity-15 px-1.5 py-0.5 rounded-full">🕒 {currentTime}</div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm transition-all duration-200 text-white hover:scale-105 shadow-md"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <RiFullscreenExitLine className="text-sm" /> : <RiFullscreenLine className="text-sm" />}
          </button>

          <div className="flex items-center gap-2.5 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white border-opacity-20">
            {vendorImage ? (
              <img
                className="rounded-lg w-7 h-7 object-cover border border-white border-opacity-25"
                src={vendorImage}
                alt={vendorName || "Restaurant Logo"}
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-white bg-opacity-20 flex items-center justify-center">
                <RiStore2Line className="text-white text-sm" />
              </div>
            )}
            <div className="text-right">
              <p className="text-xs font-bold text-white tracking-wide">{vendorName || "Vegiffy"}</p>
              <p className="text-[10px] text-white opacity-80">Vendor Panel</p>
            </div>
          </div>
        </div>
      </nav>

      <style>{`
        @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 4s linear infinite; }
        .animate-spin-slow.reverse { animation: spin-slow 4s linear infinite reverse; }
        @keyframes bounceInToast {
          0% { opacity: 0; transform: translateX(-50%) scale(0.8); }
          70% { opacity: 1; transform: translateX(-50%) scale(1.05); }
          100% { opacity: 1; transform: translateX(-50%) scale(1); }
        }
        .animate-bounce-in { animation: bounceInToast 0.3s ease-out; }
        @keyframes bounceInModal {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
};

export default Navbar;