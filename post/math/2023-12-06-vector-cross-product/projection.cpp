#include<iostream>
#include<cmath>
using namespace std;

struct Point
{
    double x, y, z;
    // Overloading the multiplication operator
    Point operator*(double k) const 
    {
        return {k*x, k*y, k*z};
    }
    Point operator+(Point A) const
    {
        return {A.x + x, A.y + y, A.z + z};
    }
};

double dotProduct(Point A, Point B)
{
    return A.x * B.x + A.y * B.y + A.z * B.z;
}

Point calcProjection(Point A, Point B, Point P)
{
    Point AB = {B.x - A.x, B.y - A.y, B.z - A.z};
    Point AP = {P.x - A.x, P.y - A.y, P.z - A.z};
    double dot_product = dotProduct(AB, AP);
    double k = dot_product / dotProduct(AB, AB);
    Point C = A + (AB * k);
    return C;
}

int main()
{
    Point A = {1, 2, 3};
    Point B = {4, 5, 6};
    Point P = {2, 3, 4};
    
    Point projectionPoint = calcProjection(A, B, P);

    cout << "Projection Point C: (" << projectionPoint.x << ", " << projectionPoint.y << ", " << projectionPoint.z << ")" << endl;

    return 0;
}