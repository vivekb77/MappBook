import React, { useState, ChangeEvent } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  query: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  query?: string;
}

interface ContactFormProps {
  onSubmit: (data: FormData) => Promise<void>;
}

const MAX_LENGTHS = {
  name: 50,
  email: 100,
  query: 500
};

const initialFormData: FormData = {
  name: '',
  email: '',
  query: ''
};

const ContactForm: React.FC<ContactFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > MAX_LENGTHS.name) {
      newErrors.name = `Name must not exceed ${MAX_LENGTHS.name} characters`;
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (formData.email.length > MAX_LENGTHS.email) {
      newErrors.email = `Email must not exceed ${MAX_LENGTHS.email} characters`;
    }
    
    if (!formData.query.trim()) {
      newErrors.query = 'Query is required';
    } else if (formData.query.length > MAX_LENGTHS.query) {
      newErrors.query = `Query must not exceed ${MAX_LENGTHS.query} characters`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      setFormData(initialFormData);
      setSubmitted(true);
    } catch (error) {
      setSubmitError('Failed to submit form. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const getCharacterCount = (fieldName: keyof typeof MAX_LENGTHS) => {
    return `${formData[fieldName].length}/${MAX_LENGTHS[fieldName]}`;
  };

  if (submitted) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <AlertDescription className="text-green-800">
          Thank you for your message! We'll get back to you soon.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">
            {submitError}
          </AlertDescription>
        </Alert>
      )}
      
      <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name *
          </label>
          <span className="text-xs text-gray-500">
            {getCharacterCount('name')}
          </span>
        </div>
        <input
          type="text"
          id="name"
          name="name"
          maxLength={MAX_LENGTHS.name}
          value={formData.name}
          onChange={handleChange}
          disabled={isSubmitting}
          className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          } ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address *
          </label>
          <span className="text-xs text-gray-500">
            {getCharacterCount('email')}
          </span>
        </div>
        <input
          type="email"
          id="email"
          name="email"
          maxLength={MAX_LENGTHS.email}
          value={formData.email}
          onChange={handleChange}
          disabled={isSubmitting}
          className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          } ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="query" className="block text-sm font-medium text-gray-700">
            Your Query *
          </label>
          <span className="text-xs text-gray-500">
            {getCharacterCount('query')}
          </span>
        </div>
        <textarea
          id="query"
          name="query"
          maxLength={MAX_LENGTHS.query}
          value={formData.query}
          onChange={handleChange}
          disabled={isSubmitting}
          rows={5}
          className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            errors.query ? 'border-red-500' : 'border-gray-300'
          } ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        {errors.query && (
          <p className="mt-1 text-sm text-red-600">{errors.query}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full flex justify-center items-center gap-2 py-2 px-4 rounded-md transition-colors ${
          isSubmitting 
            ? 'bg-blue-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          'Send Message'
        )}
      </button>
    </form>
  );
};

export default ContactForm;



//market online shop offline - what if we create dark stores for small creators to stock their products at a location ,they market online , and visit the store or we ship from the store, the store will be specifically for online sellers want to sell offline cause it will generate more profit ,we charge them for listing in the store or just pertner with existign stores to keep an isle for these prducts
// online-to-offline shopping experience https://www.mikmak.com/
// https://www.safegraph.com/free-data
// https://felt.com/pricing
// https://www.spatial.ai/industries/marketing-advertising
// https://global.xarvio.com/

// Understanding Amazon Order and Sales Reports
// Amazon Seller Central Order Reports



// https://www.putler.com/usecases/
// Identify best countries
// Geotargeting is one of the important strategies used by Marketers. But what, business owners struggle most with is identifying the geographies that they customers come from.

// Most of them rely on Google Analytics which does a commendable job of pointing out the best countries they get most traffic/conversions from but it lacks the indepth detail on who are the customers from US or who are the ones from Europe.

// Inorder to get indepth information on the location of your customers, you either need to export the whole customer list from your database and then do excel operations to group them on rely on a third party tool/app or a plugin.

// Putler helps identify the following:

// Where are my top customers located?
// Which countries give me the highest revenue?
// Which customers fall in a particular Continent/Country/State/County?
// How many customers are from a particular place?
// And lot more

// Getting answers to such questions can help you take critical business decisions like-

// Which places should I target in my ad campaigns?
// Send geo-targeted festival emails. For example: Filter customers from Ireland and send them a St. Patrick’s Day greeting.
// Give geo-targeted discounts. Extending the above example. Offer them a discount coupon in the Patrick’s Day email.
// Which countries don’t bring in as much revenue, exclude such countries while running ads.