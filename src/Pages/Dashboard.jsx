import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaShoppingCart,
  FaCheckCircle,
  FaBox,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaUtensils,
  FaLock
} from "react-icons/fa";

const Dashboard = () => {
  const [timeframe, setTimeframe] = useState("Today");
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    orderAmount: 0,
    totalProducts: 0,
    pendingOrders: 0,
    revenue: 0
  });
  const [salesData, setSalesData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsData, setProductsData] = useState([]);

  // Plan Check States
  const [hasActivePlan, setHasActivePlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [showPlanPopup, setShowPlanPopup] = useState(false);

  // Live pending orders count (read from Navbar's polling via a shared endpoint)
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [pendingOrdersList, setPendingOrdersList] = useState([]);

  const navigate = useNavigate();
  const vendorId = localStorage.getItem("vendorId");

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Check vendor plan on mount
  useEffect(() => {
    checkVendorPlan();
  }, []);

  const checkVendorPlan = async () => {
    try {
      setPlanLoading(true);

      if (!vendorId) {
        setHasActivePlan(false);
        setPlanLoading(false);
        setShowPlanPopup(true);
        return;
      }

      const response = await axios.get(`https://api.vegiffy.in/api/vendor/myplan/${vendorId}`);

      if (response.data.success && response.data.data) {
        const planData = response.data.data;
        const isPurchased = planData.isPurchased === true;
        const isNotExpired = new Date(planData.expiryDate) > new Date();

        if (isPurchased && isNotExpired) {
          setHasActivePlan(true);
          setShowPlanPopup(false);
        } else {
          setHasActivePlan(false);
          setShowPlanPopup(true);
        }
      } else {
        setHasActivePlan(false);
        setShowPlanPopup(true);
      }
    } catch (error) {
      console.error("Error checking vendor plan:", error);
      setHasActivePlan(false);
      setShowPlanPopup(true);
    } finally {
      setPlanLoading(false);
    }
  };

  // Fetch dashboard data
  useEffect(() => {
    if (!vendorId) return;

    const fetchDashboard = async () => {
      try {
        setLoading(true);

        const dashboardRes = await axios.get(`https://api.vegiffy.in/api/vendor/dashboard/${vendorId}`);
        const { stats, salesData, orders } = dashboardRes.data;

        const productsRes = await axios.get(`https://api.vegiffy.in/api/restaurant-products/${vendorId}`);
        const productsData = productsRes.data.recommendedProducts || productsRes.data.data || [];

        setStats({
          ...stats,
          totalProducts: productsData.length,
        });

        setSalesData(salesData[timeframe] || []);
        setOrders(orders.slice(0, 5));
        setProducts(productsData.slice(0, 5));
        setProductsData(productsData);

        setRevenueData([
          { name: 'Jan', revenue: 40000 },
          { name: 'Feb', revenue: 30000 },
          { name: 'Mar', revenue: 50000 },
          { name: 'Apr', revenue: 27800 },
          { name: 'May', revenue: 38900 },
          { name: 'Jun', revenue: 43900 },
        ]);

        setCategoryData([
          { name: 'Main Course', value: 35 },
          { name: 'Appetizers', value: 25 },
          { name: 'Desserts', value: 20 },
          { name: 'Beverages', value: 15 },
          { name: 'Salads', value: 5 },
        ]);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [vendorId, timeframe]);

  // Poll pending orders count independently (lightweight, for display only)
  useEffect(() => {
    if (!vendorId) return;

    const fetchPending = async () => {
      try {
        const res = await axios.get(`https://api.vegiffy.in/api/vendor/restaurantorders/${vendorId}`);
        const all = res.data.data || res.data || [];
        const pending = all.filter(o => o.orderStatus === "Pending" || o.orderStatus === "pending");
        setPendingOrdersCount(pending.length);
        setPendingOrdersList(pending.slice(0, 5));
      } catch (_) {}
    };

    fetchPending();
    const interval = setInterval(fetchPending, 5000);
    return () => clearInterval(interval);
  }, [vendorId]);

  // Fetch products separately
  useEffect(() => {
    if (!vendorId) return;
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`https://api.vegiffy.in/api/restaurant-products/${vendorId}`);
        const data = res.data.recommendedProducts || res.data.data || [];
        setProductsData(data);
        setProducts(data.slice(0, 5));
      } catch (_) {}
    };
    fetchProducts();
  }, [vendorId]);

  // Navigation with plan guard
  const navigateToOrders = () => {
    if (hasActivePlan === false) { setShowPlanPopup(true); return; }
    navigate('/allorders');
  };

  const navigateToPendingOrdersPage = () => {
    if (hasActivePlan === false) { setShowPlanPopup(true); return; }
    navigate('/pendingorders');
  };

  const navigateToProducts = () => {
    if (hasActivePlan === false) { setShowPlanPopup(true); return; }
    navigate('/productlist');
  };

  const navigateToOrderDetails = (orderId) => {
    if (hasActivePlan === false) { setShowPlanPopup(true); return; }
    navigate(`/order/${orderId}`);
  };

  // Plan Required Popup
  const PlanRequiredPopup = () => {
    if (!showPlanPopup) return null;
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full" style={{ animation: 'popupIn 0.2s ease-out' }}>
          <div className="p-6 bg-gradient-to-r from-red-500 to-pink-600 rounded-t-3xl">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <FaLock className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">Plan Required</h3>
                <p className="text-white/90 text-sm">Active plan needed</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <p className="text-red-700 text-sm">
                  You don't have an active plan. Please purchase a plan to access all features.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: 'ri-store-line', label: 'Manage Restaurant' },
                  { icon: 'ri-shopping-bag-line', label: 'Add Products' },
                  { icon: 'ri-money-rupee-circle-line', label: 'Receive Payments' },
                  { icon: 'ri-bar-chart-line', label: 'View Analytics' },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center p-3 bg-green-50 rounded-xl">
                    <i className={`${icon} text-green-500 mr-2`} />
                    <span className="text-gray-700 text-xs">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowPlanPopup(false); navigate("/vendorpay"); }}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:opacity-90 transition-all text-sm"
              >
                Buy Plan
              </button>
              <button
                onClick={() => { setShowPlanPopup(false); navigate("/myplans"); }}
                className="flex-1 py-3 border border-gray-300 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-all text-sm"
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const StatCard = ({ title, value, icon, color, change, onClick }) => (
    <div
      className={`bg-white rounded-2xl shadow-lg p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-l-4 ${color} border ${hasActivePlan === false ? 'opacity-75 hover:opacity-100' : ''}`}
      onClick={() => {
        if (hasActivePlan === false) setShowPlanPopup(true);
        else if (onClick) onClick();
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
              {Math.abs(change)}% from last month
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color} bg-opacity-10 relative`}>
          {icon}
          {hasActivePlan === false && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <FaLock className="text-white text-[8px]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const LockedOverlay = () => (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] rounded-2xl flex items-center justify-center z-10">
      <button
        onClick={() => setShowPlanPopup(true)}
        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:opacity-90 transition-all flex items-center space-x-2"
      >
        <FaLock /><span>Unlock with Plan</span>
      </button>
    </div>
  );

  if (loading || planLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 text-lg">{planLoading ? 'Checking Plan...' : 'Loading Dashboard...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <PlanRequiredPopup />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
              <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your restaurant today.</p>
            </div>
          </div>

          {/* Plan Status Warning */}
          {hasActivePlan === false && (
            <div className="mt-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <div>
                  <span className="text-red-800 font-medium">⚠️ No Active Plan - Features are locked</span>
                  <span className="ml-3 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">ACTION REQUIRED</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => setShowPlanPopup(true)} className="text-red-700 hover:text-red-900 font-medium text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg transition-colors">
                  View Plans
                </button>
                <button onClick={() => navigate("/vendorpay")} className="text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 font-medium text-sm px-4 py-1 rounded-lg transition-colors">
                  Buy Plan
                </button>
              </div>
            </div>
          )}

          {/* Pending Orders Banner */}
          {pendingOrdersCount > 0 && hasActivePlan !== false && (
            <div className="mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-yellow-800 font-medium">
                  {pendingOrdersCount} pending order{pendingOrdersCount > 1 ? 's' : ''} — check the notification in the navbar
                </span>
              </div>
              <button onClick={navigateToPendingOrdersPage} className="text-yellow-700 hover:text-yellow-900 font-medium text-sm bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded-lg transition-colors">
                View All
              </button>
            </div>
          )}
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<FaShoppingCart className="text-2xl text-blue-600" />}
            color="border-blue-500"
            change={12}
            onClick={navigateToOrders}
          />
          <StatCard
            title="Completed Orders"
            value={stats.completedOrders}
            icon={<FaCheckCircle className="text-2xl text-green-600" />}
            color="border-green-500"
            change={8}
            onClick={navigateToOrders}
          />
          <StatCard
            title="Pending Orders"
            value={pendingOrdersCount}
            icon={<FaClock className="text-2xl text-yellow-600" />}
            color="border-yellow-500"
            change={-5}
            onClick={navigateToPendingOrdersPage}
          />
          <StatCard
            title="Total Products"
            value={productsData.length}
            icon={<FaUtensils className="text-2xl text-purple-600" />}
            color="border-purple-500"
            onClick={navigateToProducts}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6 relative">
            {hasActivePlan === false && <LockedOverlay />}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Sales Performance</h3>
              <select
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={timeframe}
                onChange={e => setTimeframe(e.target.value)}
                disabled={hasActivePlan === false}
              >
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="Last Week">Last Week</option>
                <option value="Last Month">Last Month</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" /><YAxis />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Bar dataKey="sales" fill="#4F46E5" barSize={30} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6 relative">
            {hasActivePlan === false && <LockedOverlay />}
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" /><YAxis />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Category Distribution */}
          <div className="bg-white rounded-2xl shadow-lg p-6 relative">
            {hasActivePlan === false && <LockedOverlay />}
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Category Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 relative">
            {hasActivePlan === false && <LockedOverlay />}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Recent Orders</h3>
              <button onClick={navigateToOrders} className="text-blue-600 hover:text-blue-800 font-medium text-sm" disabled={hasActivePlan === false}>
                View All
              </button>
            </div>
            <div className="space-y-4">
              {orders.length > 0 ? orders.map(order => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => navigateToOrderDetails(order._id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaShoppingCart className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Order #{order._id?.slice(-8)}</p>
                      <p className="text-sm text-gray-600">{order.paymentMethod}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">₹{order.totalPayable}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${order.orderStatus === "Completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <FaShoppingCart className="text-4xl text-gray-300 mx-auto mb-3" />
                  <p>No recent orders</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Orders List */}
          <div className="bg-white rounded-2xl shadow-lg p-6 relative">
            {hasActivePlan === false && <LockedOverlay />}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Pending Orders</h3>
              <button onClick={navigateToPendingOrdersPage} className="text-blue-600 hover:text-blue-800 font-medium text-sm" disabled={hasActivePlan === false}>
                View All
              </button>
            </div>
            <div className="space-y-3">
              {pendingOrdersList.length > 0 ? pendingOrdersList.map(order => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-3 border border-yellow-200 rounded-lg bg-yellow-50 hover:bg-yellow-100 cursor-pointer transition-colors"
                  onClick={() => { if (hasActivePlan === false) setShowPlanPopup(true); else navigateToOrderDetails(order._id); }}
                >
                  <div>
                    <p className="font-medium text-gray-800">#{order._id?.slice(-8)}</p>
                    <p className="text-sm text-gray-600">{order.paymentMethod}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{order.totalAmount || order.totalPayable}</p>
                    <p className="text-xs text-yellow-600 font-medium">Pending</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 text-gray-500">
                  <FaCheckCircle className="text-3xl text-green-300 mx-auto mb-2" />
                  <p>No pending orders</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-2xl shadow-lg p-6 relative">
            {hasActivePlan === false && <LockedOverlay />}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Top Products</h3>
              <button onClick={navigateToProducts} className="text-blue-600 hover:text-blue-800 font-medium text-sm" disabled={hasActivePlan === false}>
                View All
              </button>
            </div>
            <div className="space-y-3">
              {products.length > 0 ? products.map((product, i) => (
                <div key={product._id || product.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold text-purple-600">{i + 1}</div>
                    <div>
                      <p className="font-medium text-gray-800">{product.name || product.productName}</p>
                      <p className="text-sm text-gray-600">₹{product.basePrice || product.price}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600">{product.category || 'General'}</p>
                    <p className="text-xs text-green-600">In Stock</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 text-gray-500">
                  <FaBox className="text-3xl text-gray-300 mx-auto mb-2" />
                  <p>No products available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes popupIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;