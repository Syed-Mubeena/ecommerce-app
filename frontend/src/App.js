import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [name, setName] = useState(localStorage.getItem('name') || '');
  const [role, setRole] = useState(localStorage.getItem('role') || '');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [view, setView] = useState('shop'); // shop | cart | orders | admin
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', image: '', category: '', stock: '' });
  const [myOrders, setMyOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { if (token && view === 'orders') fetchMyOrders(); }, [token, view]);
  useEffect(() => { if (token && role === 'admin' && view === 'admin') fetchAllOrders(); }, [token, role, view]);

  const fetchProducts = async () => {
    try { const res = await axios.get(`${API}/products`); setProducts(res.data); } catch {}
  };
  const fetchMyOrders = async () => {
    try { const res = await axios.get(`${API}/orders/my`, authHeaders); setMyOrders(res.data); } catch {}
  };
  const fetchAllOrders = async () => {
    try { const res = await axios.get(`${API}/orders`, authHeaders); setAllOrders(res.data); } catch {}
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const url = isLogin ? `${API}/auth/login` : `${API}/auth/register`;
      const payload = isLogin ? { email: authForm.email, password: authForm.password } : authForm;
      const res = await axios.post(url, payload);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('name', res.data.name);
      localStorage.setItem('role', res.data.role);
      setToken(res.data.token); setName(res.data.name); setRole(res.data.role);
    } catch (err) { setError(err.response?.data?.msg || 'Something went wrong'); }
  };

  const logout = () => { localStorage.clear(); setToken(''); setName(''); setRole(''); setCart([]); setView('shop'); };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === product._id);
      if (existing) return prev.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };
  const changeQty = (id, delta) => {
    setCart(prev => prev.map(i => i._id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i._id !== id));
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const checkout = async () => {
    if (!token) { setView('shop'); setError('Please login to checkout'); return; }
    try {
      const items = cart.map(i => ({ product: i._id, name: i.name, price: i.price, quantity: i.qty }));
      await axios.post(`${API}/orders`, { items, total: cartTotal }, authHeaders);
      setCart([]);
      setView('orders');
    } catch (err) { setError('Checkout failed'); }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newProduct, price: Number(newProduct.price), stock: Number(newProduct.stock) };
      await axios.post(`${API}/products`, payload, authHeaders);
      setNewProduct({ name: '', description: '', price: '', image: '', category: '', stock: '' });
      fetchProducts();
    } catch { setError('Failed to add product'); }
  };
  const deleteProduct = async (id) => {
    try { await axios.delete(`${API}/products/${id}`, authHeaders); fetchProducts(); } catch {}
  };
  const updateOrderStatus = async (id, status) => {
    try { await axios.put(`${API}/orders/${id}`, { status }, authHeaders); fetchAllOrders(); } catch {}
  };

  const inputStyle = { padding: '10px 14px', borderRadius: '8px', border: '0.5px solid rgba(175,169,236,0.2)', background: 'rgba(255,255,255,0.04)', color: '#e8e6f0', fontSize: '14px', outline: 'none', width: '100%' };
  const statusColor = { pending: '#d4860b', shipped: '#534AB7', delivered: '#1a7a4a' };
  const statusBg = { pending: 'rgba(212,134,11,0.12)', shipped: 'rgba(83,74,183,0.12)', delivered: 'rgba(26,122,74,0.12)' };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f13', fontFamily: "'Segoe UI',sans-serif", color: '#e8e6f0' }}>

      {/* NAVBAR */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15,15,19,0.95)', borderBottom: '0.5px solid rgba(175,169,236,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', height: '56px', flexWrap: 'wrap' }}>
        <div onClick={() => setView('shop')} style={{ fontWeight: 700, color: '#AFA9EC', fontSize: '16px', cursor: 'pointer' }}>🛍️ ShopEasy</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setView('shop')} style={{ background: view === 'shop' ? 'rgba(83,74,183,0.15)' : 'transparent', border: 'none', color: '#AFA9EC', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Shop</button>
          <button onClick={() => setView('cart')} style={{ background: view === 'cart' ? 'rgba(83,74,183,0.15)' : 'transparent', border: 'none', color: '#AFA9EC', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', position: 'relative' }}>
            Cart {cart.length > 0 && <span style={{ background: '#534AB7', color: '#fff', borderRadius: '50%', padding: '1px 6px', fontSize: '11px', marginLeft: '4px' }}>{cart.length}</span>}
          </button>
          {token && <button onClick={() => setView('orders')} style={{ background: view === 'orders' ? 'rgba(83,74,183,0.15)' : 'transparent', border: 'none', color: '#AFA9EC', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>My Orders</button>}
          {token && role === 'admin' && <button onClick={() => setView('admin')} style={{ background: view === 'admin' ? 'rgba(83,74,183,0.15)' : 'transparent', border: 'none', color: '#FAC775', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>⚙ Admin</button>}
          {token ? (
            <>
              <span style={{ fontSize: '13px', color: '#888' }}>Hi, <span style={{ color: '#AFA9EC' }}>{name}</span></span>
              <button onClick={logout} style={{ background: 'transparent', border: '0.5px solid rgba(175,169,236,0.3)', color: '#AFA9EC', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Logout</button>
            </>
          ) : (
            <button onClick={() => setView('auth')} style={{ background: '#534AB7', border: 'none', color: '#fff', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Login</button>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
        {error && <div style={{ background: 'rgba(220,50,50,0.1)', border: '0.5px solid rgba(220,50,50,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '1.5rem' }}>{error} <span onClick={() => setError('')} style={{ float: 'right', cursor: 'pointer' }}>×</span></div>}

        {/* AUTH VIEW */}
        {view === 'auth' && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(175,169,236,0.2)', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '380px' }}>
              <h2 style={{ color: '#f0eeff', marginBottom: '0.5rem', fontSize: '1.4rem' }}>{isLogin ? '👋 Welcome back' : '🚀 Create account'}</h2>
              <p style={{ color: '#666', fontSize: '13px', marginBottom: '1.5rem' }}>ShopEasy</p>
              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {!isLogin && <input required placeholder="Full name" value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} style={inputStyle} />}
                <input required type="email" placeholder="Email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} style={inputStyle} />
                <input required type="password" placeholder="Password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} style={inputStyle} />
                <button type="submit" style={{ background: '#534AB7', color: '#fff', border: 'none', padding: '11px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>{isLogin ? 'Login' : 'Register'}</button>
              </form>
              <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '13px', color: '#666' }}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <span onClick={() => { setIsLogin(!isLogin); setError(''); }} style={{ color: '#AFA9EC', cursor: 'pointer' }}>{isLogin ? 'Register' : 'Login'}</span>
              </p>
            </div>
          </div>
        )}

        {/* SHOP VIEW */}
        {view === 'shop' && (
          <>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f0eeff', marginBottom: '1.5rem' }}>All Products</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {products.map(p => (
                <div key={p._id} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(175,169,236,0.12)', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ height: '140px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                    {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#f0eeff', marginBottom: '4px' }}>{p.name}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>{p.category}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#AFA9EC' }}>₹{p.price}</span>
                      <button onClick={() => addToCart(p)} style={{ background: '#534AB7', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>+ Cart</button>
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && <div style={{ color: '#666', gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>No products yet</div>}
            </div>
          </>
        )}

        {/* CART VIEW */}
        {view === 'cart' && (
          <>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f0eeff', marginBottom: '1.5rem' }}>Your Cart</div>
            {cart.length === 0 ? <div style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>Cart is empty</div> : (
              <div>
                {cart.map(i => (
                  <div key={i._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(175,169,236,0.12)', borderRadius: '10px', padding: '1rem', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{i.name}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>₹{i.price} each</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button onClick={() => changeQty(i._id, -1)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', width: '26px', height: '26px', borderRadius: '6px', cursor: 'pointer' }}>-</button>
                      <span>{i.qty}</span>
                      <button onClick={() => changeQty(i._id, 1)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', width: '26px', height: '26px', borderRadius: '6px', cursor: 'pointer' }}>+</button>
                      <span style={{ width: '60px', textAlign: 'right', color: '#AFA9EC' }}>₹{i.price * i.qty}</span>
                      <button onClick={() => removeFromCart(i._id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>×</button>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem', background: 'rgba(83,74,183,0.08)', borderRadius: '10px' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Total: ₹{cartTotal}</span>
                  <button onClick={checkout} style={{ background: '#534AB7', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Checkout</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* MY ORDERS VIEW */}
        {view === 'orders' && (
          <>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f0eeff', marginBottom: '1.5rem' }}>My Orders</div>
            {myOrders.length === 0 ? <div style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>No orders yet</div> : myOrders.map(o => (
              <div key={o._id} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(175,169,236,0.12)', borderRadius: '10px', padding: '1rem', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>{new Date(o.createdAt).toLocaleDateString()}</span>
                  <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '20px', background: statusBg[o.status], color: statusColor[o.status] }}>{o.status}</span>
                </div>
                {o.items.map((it, idx) => <div key={idx} style={{ fontSize: '13px', color: '#aaa' }}>{it.name} × {it.quantity}</div>)}
                <div style={{ marginTop: '8px', fontWeight: 700, color: '#AFA9EC' }}>Total: ₹{o.total}</div>
              </div>
            ))}
          </>
        )}

        {/* ADMIN VIEW */}
        {view === 'admin' && role === 'admin' && (
          <>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f0eeff', marginBottom: '1.5rem' }}>Admin Panel</div>

            <form onSubmit={addProduct} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(175,169,236,0.12)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ fontSize: '13px', color: '#534AB7', fontWeight: 600, textTransform: 'uppercase', marginBottom: '1rem' }}>Add Product</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '10px', marginBottom: '10px' }}>
                <input required placeholder="Name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} style={inputStyle} />
                <input placeholder="Category" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} style={inputStyle} />
                <input required type="number" placeholder="Price" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} style={inputStyle} />
                <input type="number" placeholder="Stock" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} style={inputStyle} />
                <input placeholder="Image URL (optional)" value={newProduct.image} onChange={e => setNewProduct({ ...newProduct, image: e.target.value })} style={inputStyle} />
              </div>
              <textarea placeholder="Description" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} style={{ ...inputStyle, marginBottom: '10px', resize: 'vertical' }} rows={2} />
              <button type="submit" style={{ background: '#534AB7', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>+ Add Product</button>
            </form>

            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f0eeff', marginBottom: '1rem' }}>Manage Products</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: '12px', marginBottom: '2rem' }}>
              {products.map(p => (
                <div key={p._id} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(175,169,236,0.12)', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>₹{p.price} · Stock: {p.stock}</div>
                  <button onClick={() => deleteProduct(p._id)} style={{ background: 'rgba(220,50,50,0.1)', border: '0.5px solid rgba(220,50,50,0.3)', color: '#f87171', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Delete</button>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f0eeff', marginBottom: '1rem' }}>All Orders</div>
            {allOrders.map(o => (
              <div key={o._id} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(175,169,236,0.12)', borderRadius: '10px', padding: '1rem', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px' }}>{o.user?.name} ({o.user?.email})</span>
                  <span style={{ fontWeight: 700, color: '#AFA9EC' }}>₹{o.total}</span>
                </div>
                {o.items.map((it, idx) => <div key={idx} style={{ fontSize: '12px', color: '#888' }}>{it.name} × {it.quantity}</div>)}
                <select value={o.status} onChange={e => updateOrderStatus(o._id, e.target.value)}
                  style={{ marginTop: '8px', padding: '5px 10px', borderRadius: '6px', border: `0.5px solid ${statusColor[o.status]}44`, background: statusBg[o.status], color: statusColor[o.status], fontSize: '12px', cursor: 'pointer' }}>
                  <option value="pending">Pending</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}