import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { 
  ArrowRight, 
  CheckCircle, 
  Users, 
  TrendingUp, 
  Award,
  Microscope,
  Calculator,
  BookOpen,
  Palette,
  Wrench,
  Trophy
} from "lucide-react";
import heroStudents from "@/assets/hero-students.jpg";

const Index = () => {
  const features = [
    {
      icon: <CheckCircle className="h-6 w-6 text-success" />,
      title: "Personalized Assessment",
      description: "Answer questions about your interests, aptitudes, and goals to get tailored recommendations."
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      title: "Smart Analysis",
      description: "Our system analyzes your responses using proven educational frameworks and career mapping."
    },
    {
      icon: <Award className="h-6 w-6 text-warning" />,
      title: "Detailed Results",
      description: "Get comprehensive reports with match percentages and career pathway information."
    }
  ];

  const strands = [
    { name: "STEM", icon: <Microscope className="h-5 w-5" />, color: "text-blue-600", description: "Science, Technology, Engineering, Math" },
    { name: "ABM", icon: <Calculator className="h-5 w-5" />, color: "text-emerald-600", description: "Accountancy, Business, Management" },
    { name: "HUMSS", icon: <Users className="h-5 w-5" />, color: "text-purple-600", description: "Humanities & Social Sciences" }, 
    { name: "GAS", icon: <BookOpen className="h-5 w-5" />, color: "text-orange-600", description: "General Academic Strand" },
    { name: "Arts", icon: <Palette className="h-5 w-5" />, color: "text-pink-600", description: "Arts & Design Track" },
    { name: "TVL", icon: <Wrench className="h-5 w-5" />, color: "text-amber-600", description: "Technical-Vocational-Livelihood" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit">
                  🎓 Find Your Perfect SHS Strand
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  Discover the 
                  <span className="text-primary"> SHS strand </span>
                  that fits you best
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Take our comprehensive assessment to get personalized recommendations for your Senior High School strand based on your interests, aptitudes, and career goals.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/student/login">
                  <Button variant="hero" size="lg" className="w-full sm:w-auto">
                    Start Assessment
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/careers">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Explore Career Paths
                  </Button>
                </Link>
              </div>

              <div className="flex items-center space-x-8 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>Free Assessment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>Instant Results</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>Career Guidance</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={heroStudents} 
                  alt="Students exploring their future careers" 
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
              </div>
              
              {/* Floating Cards */}
              <div className="absolute -top-4 -left-4 bg-white rounded-lg shadow-lg p-4 animate-float">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-semibold">85% Match</div>
                    <div className="text-xs text-muted-foreground">STEM</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-white rounded-lg shadow-lg p-4 animate-float delay-500">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-success" />
                  <div>
                    <div className="text-sm font-semibold">10K+</div>
                    <div className="text-xs text-muted-foreground">Students Helped</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              How SHSNavigator Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our scientifically-backed assessment process helps you discover your ideal SHS strand in just three simple steps.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SHS Strands Overview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Explore All SHS Strands
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Learn about the different Senior High School strands and discover which one aligns with your interests and career goals.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strands.map((strand, index) => (
              <Card key={index} className="hover:shadow-lg transition-all hover:scale-105">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`${strand.color} bg-muted/20 p-2 rounded-lg`}>
                      {strand.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{strand.name}</CardTitle>
                      <CardDescription className="text-sm">{strand.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/careers">
              <Button variant="outline" size="lg">
                View Detailed Career Paths
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
            Ready to Find Your Perfect SHS Strand?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of students who have discovered their ideal academic path with SHSNavigator. Start your journey today!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/student/login">
              <Button variant="hero" size="lg">
                <Trophy className="h-5 w-5 mr-2" />
                Take Free Assessment
              </Button>
            </Link>
            <Link to="/student/login">
              <Button variant="outline" size="lg">
                Create Student Account
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 text-sm text-muted-foreground">
            ✨ No registration required to start • Get instant results • Completely free
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
