import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { FeaturedProgramsSection } from "../components/sections/FeaturedProgramsSection";
import Image from 'next/image';
import axiosInstance from "../lib/axiosInstance";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/router";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Fetch products from the API
    const fetchProducts = async () => {
      try {
        const { data } = await axiosInstance.get("/api/plans");
        
        if (data.success) {
          // Transform API data to match the UI format
          const formattedProducts = data.plans.map(plan => {
            // Using the first variant as default
            const defaultVariant = plan.variants && plan.variants.length > 0 ? plan.variants[0] : null;
            
            return {
              id: plan.id,
              title: plan.name,
              description: plan.description,
              image: plan.image_url || "/images/placeholder-plan.jpg",
              price: defaultVariant ? `${defaultVariant.price}€` : `${plan.base_price}€`,
              originalPrice: plan.discount_price ? `${plan.base_price}€` : null,
              discount: plan.discount_percentage ? `${plan.discount_percentage}% OFF` : null,
              category: plan.category_id,
              category_name: plan.category_name,
              features: plan.features ? plan.features.map(f => f.description) : [],
              variants: plan.variants || [],
              status: plan.status,
              is_active: plan.is_active
            };
          });
          
          setProducts(formattedProducts);
          setFilteredProducts(formattedProducts);
          
          // Extract unique categories
          const categoriesData = data.categories || [];
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Erro ao carregar planos. Por favor, tente novamente mais tarde.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(product => 
        product.category == selectedCategory
      ));
    }
  }, [selectedCategory, products]);
  
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
  };
  
  const handlePurchase = async (planId, variantId) => {
    try {
      setIsProcessing(true);
      
      // Check if user is logged in
      const sessionResponse = await axiosInstance.get("/api/session");
      if (!sessionResponse.data.valid) {
        toast.info("Por favor, faça login para comprar este plano.");
        router.push("/auth?redirect=products");
        return;
      }
      
      // Create purchase
      const { data } = await axiosInstance.post("/api/purchases/create", {
        plan_id: planId,
        variant_id: variantId || (products.find(p => p.id === planId).variants[0]?.id)
      });
      
      if (data.success && data.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url;
      } else {
        throw new Error("Falha ao criar sessão de checkout");
      }
    } catch (error) {
      console.error("Error creating purchase:", error);
      toast.error("Erro ao processar compra. Por favor, tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Head>
        <title>Planos de Treino | Diogo Samuel</title>
        <meta name="description" content="Descubra os planos de treino personalizados do Diogo Samuel para transformar o seu corpo e saúde." />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <ToastContainer position="top-right" autoClose={5000} />

      <main className="bg-[#0D0D0D] min-h-screen">
        <Navbar />

        {/* Header Section */}
        <section className="pt-32 pb-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
              Planos de Treino
            </h1>
            <p className="text-gray-400 text-center max-w-2xl mx-auto">
              Escolhe o plano que melhor se adapta aos teus objetivos e nível de experiência. 
              Todos os programas incluem suporte personalizado e atualizações gratuitas.
            </p>
          </div>
        </section>

        {/* Featured Programs Section */}
        <FeaturedProgramsSection />

        {/* Category Filter */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <button
                onClick={() => handleCategoryChange('all')}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-[#FF8A00] text-white'
                    : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#303030]'
                }`}
              >
                Todos
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-[#FF8A00] text-white'
                      : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#303030]'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF8A00]"></div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredProducts.length === 0 && (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4 text-5xl">😢</div>
                <h3 className="text-xl font-semibold text-white mb-2">Nenhum plano encontrado</h3>
                <p className="text-gray-400">Não encontrámos planos para esta categoria. Tente outra opção.</p>
              </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#303030] hover:border-[#FF8A00] transition-colors">
                  <div className="relative h-48 overflow-hidden">
                    <Image 
                      src={product.image} 
                      alt={product.title}
                      fill
                      className="object-cover transform hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] to-transparent" />
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-white">{product.title}</h3>
                      <div className="flex flex-col items-end">
                        <span className="text-[#FF8A00] font-bold text-2xl">{product.price}</span>
                        <span className="text-gray-500 line-through text-sm">{product.originalPrice}</span>
                        <span className="bg-[#FF8A00]/10 text-[#FF8A00] text-xs font-medium px-2 py-1 rounded">
                          {product.discount}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-400 mb-6">{product.description}</p>
                    <ul className="space-y-3 mb-6">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-gray-300">
                          <svg className="w-5 h-5 text-[#FF8A00] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={() => handlePurchase(product.id)}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-[#FF8A00] to-[#FF5F00] text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? 'Processando...' : 'Comprar Agora'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
} 