'use client';

import { FC } from 'react';
import Link from 'next/link';

const HexagonArticlePage: FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <div className="flex items-center">
                <div className="bg-gray-800 px-3 py-1.5 rounded-lg shadow-md">
                  <h1 className="text-2xl font-bold tracking-wide">
                    <span className="text-gray-100">Mapp</span>
                    <span className="text-blue-500">Book</span>
                  </h1>
                </div>
              </div>
            </div>
            <Link
              href="/"
              className="text-blue-500 hover:text-blue-400 font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-100 mb-4">Hexagons: Nature's Perfect Shape</h2>
            <p className="text-gray-400">Last updated: April 3, 2025</p>
            <div className="mt-4 text-gray-300">
              <p>
                Welcome to our comprehensive guide on hexagons, one of the most fascinating shapes found in both natural and human-made designs. The hexagon shape is incredibly prevalent in nature, appearing in everything from honeycomb patterns to the cellular structure of certain plants. In this article, we'll explore why the 6-sided polygon is so popular, its mathematical properties, and its countless applications in our world.
              </p>
            </div>
          </section>

          {/* What is a Hexagon? */}
          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-100 mb-4">What is a Hexagon?</h3>
            <div className="space-y-4 text-gray-300">
              <p>
                A hexagon is a polygon with six sides and six angles. While this basic definition applies to all hexagons, they can exist in both regular and irregular forms:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-gray-100">Regular Hexagon:</strong> All six sides have equal length, and all internal angles are equal (120°)
                </li>
                <li>
                  <strong className="text-gray-100">Irregular Hexagon:</strong> Side lengths and angles may vary, but the shape still has six sides
                </li>
              </ul>
              <p>
                The regular hexagon is particularly special because of its perfect symmetry and unique mathematical properties. It's this regular form that we most commonly observe in nature and utilize in various applications.
              </p>
            </div>
          </section>

          {/* Mathematical Properties */}
          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-100 mb-4">Key Mathematical Properties</h3>
            <div className="space-y-4 text-gray-300">
              <p>For a regular hexagon with side length <em>a</em>, we can calculate several important measurements:</p>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-gray-100 font-medium mb-2">Essential Formulas for Regular Hexagons</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Perimeter:</strong> 6 × side length</li>
                  <li><strong>Area:</strong> (3√3/2) × side length²</li>
                  <li><strong>Internal Angle:</strong> 120°</li>
                  <li><strong>Sum of All Angles:</strong> 720°</li>
                  <li><strong>Apothem (inradius):</strong> (√3/2) × side length</li>
                  <li><strong>Circumradius:</strong> side length</li>
                  <li><strong>Long Diagonal:</strong> 2 × side length</li>
                  <li><strong>Short Diagonal:</strong> √3 × side length</li>
                </ul>
              </div>

              <p className="mt-4">
                The regular hexagon has 9 diagonals in total - three long diagonals that pass through the center point, and six shorter diagonals. These properties make the hexagon particularly suited for efficient designs in nature and engineering.
              </p>
            </div>
          </section>

          {/* Area Calculation */}
          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-100 mb-4">Calculating a Hexagon's Area</h3>
            <div className="space-y-4 text-gray-300">
              <p>
                There are several approaches to calculating the area of a regular hexagon. The standard formula is:
              </p>
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <p className="text-xl">Area = (3√3/2) × side length²</p>
              </div>
              <p className="mt-4">
                However, we can also think of a regular hexagon as six equilateral triangles meeting at the center. Each triangle has:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Base = side length of the hexagon</li>
                <li>Height = apothem = (√3/2) × side length</li>
                <li>Area of one triangle = (side length × height)/2</li>
              </ul>
              <p>
                When we multiply by six, we arrive at the same formula: 6 × (side length × √3/2 × side length)/2 = (3√3/2) × side length².
              </p>
              <p>
                Alternatively, we can use the general polygon area formula: Area = (apothem × perimeter)/2, which gives us the same result.
              </p>
            </div>
          </section>

          {/* Why Hexagons Are Common in Nature */}
          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-100 mb-4">Why Hexagons Dominate in Nature</h3>
            <div className="space-y-4 text-gray-300">
              <p>
                The prevalence of hexagonal patterns in nature is no coincidence. Several factors make the hexagon an optimal shape:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-gray-100">Space Efficiency:</strong> Regular hexagons can tessellate (fit together perfectly) to cover a surface with no gaps, just like triangles and squares. However, among these shapes, hexagons have the smallest perimeter for a given area, making them material-efficient.
                </li>
                <li>
                  <strong className="text-gray-100">Structural Stability:</strong> The 120° angles at each vertex distribute forces and stress optimally, creating very stable structures.
                </li>
                <li>
                  <strong className="text-gray-100">Energy Minimization:</strong> In many natural systems, hexagonal arrangements represent the lowest energy state, as seen in bubble formations and crystal structures.
                </li>
              </ul>
              <p>
                This is why we see hexagons in:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Honeycomb structures built by bees</li>
                <li>The compound eyes of insects</li>
                <li>Basalt rock formations (like the Giant's Causeway)</li>
                <li>Certain snowflake patterns</li>
                <li>Carbon molecules and other organic compounds</li>
                <li>Bubble formations when packed together</li>
              </ul>
            </div>
          </section>

          {/* Hexagons in Our App */}
          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-100 mb-4">Hexagons: Reimagining Borders for the Modern Age</h3>
            <div className="space-y-4 text-gray-300">
              <p>
                In our application, we've harnessed the power of hexagons to create a revolutionary new approach to mapping and territorial representation. Here's why hexagons form the foundation of our platform:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-gray-100">Beyond Traditional Borders:</strong> Instead of using arbitrary lines drawn based on historical conflicts, language differences, or geographical features, our hexagonal grid provides a neutral, mathematical approach to dividing space.
                </li>
                <li>
                  <strong className="text-gray-100">Equal Representation:</strong> Each hexagon represents an equal unit of area, removing the distortions and power imbalances that can occur with traditional mapping methods.
                </li>
                <li>
                  <strong className="text-gray-100">Community-Centric:</strong> Our hexagons allow communities to form and express themselves based on shared interests and values rather than being constrained by traditional borders that often divide natural communities.
                </li>
                <li>
                  <strong className="text-gray-100">Data Visualization:</strong> The regular, uniform nature of hexagons makes them ideal for visualizing complex data patterns across regions without the visual biases introduced by irregularly shaped territories.
                </li>
                <li>
                  <strong className="text-gray-100">Adaptability:</strong> The hexagonal grid can be applied at different scales, from neighborhood-level to global analysis, providing a consistent framework for spatial understanding.
                </li>
              </ul>
              <p className="mt-4">
                By using hexagons as our foundational mapping unit, we're not just employing an efficient geometric shape – we're embracing a new paradigm that transcends traditional notions of borders and territories. This approach allows users to see connections and patterns that might be obscured by conventional maps constrained by political boundaries.
              </p>
              <p>
                Whether you're tracking fan distribution, analyzing demographic trends, or visualizing any other spatial data, our hexagonal framework provides a more equitable, mathematically sound, and visually coherent system than conventional mapping approaches.
              </p>
            </div>
          </section>

          {/* Conclusion */}
          <section className="border-t border-gray-700 pt-8">
            <h3 className="text-2xl font-semibold text-gray-100 mb-4">The Enduring Appeal of Hexagons</h3>
            <div className="space-y-4 text-gray-300">
              <p>
                From the microscopic world of organic molecules to the vast expanses of space observed through hexagonal-mirrored telescopes, the six-sided shape continues to prove its worth. Its perfect blend of efficiency, stability, and elegance makes it not just mathematically significant but fundamentally important to how our world functions.
              </p>
              <p>
                Whether you're a mathematician, designer, engineer, or simply someone who appreciates patterns in nature, the hexagon offers endless fascination and practical application. Next time you spot a honeycomb or hexagonal tile, take a moment to appreciate this remarkable shape that continues to influence our world in countless ways.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default HexagonArticlePage;