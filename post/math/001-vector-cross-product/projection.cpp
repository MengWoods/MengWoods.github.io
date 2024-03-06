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
    bool operator==(Point A) const
    {
        if (A.x == x and A.y == y and A.z == z)
        {
            return true;
        }
        else
        {
            return false;
        }
    }
};

double dotProduct(Point A, Point B)
{
    return A.x * B.x + A.y * B.y + A.z * B.z;
}

Point crossProduct(Point A, Point B)
{
    return {A.y * B.z - A.z * B.y,
            A.x * B.z - A.z * B.x,
            A.x * B.y - A.y * B.x};
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

bool verifyProjection(Point A, Point B, Point P, Point C)
{
    Point AC = {C.x - A.x, C.y - A.y, C.z - A.z};
    Point AB = {B.x - A.x, B.y - A.y, B.z - A.z};
    Point PC = {C.x - P.x, C.y - P.y, C.z - P.z};
    double dot_product = dotProduct(PC, AB);
    Point cross_product = crossProduct(AC, AB);
    Point zero_vec = {0, 0, 0};
    if (dot_product == 0 and cross_product == zero_vec)
    {
        return true;
    }
    else
    {
        return false;
    }
}

int main()
{
    Point A = {1, 2, 3};
    Point B = {4, 5, 6};
    Point P = {2, 3, 4};
    
    Point C = calcProjection(A, B, P);

    cout << "Projection Point C: (" << C.x << ", " << C.y << ", " << C.z << ")" << endl;

    if (verifyProjection(A, B, P, C))
    {
        cout << "Correct!" << endl;
    }
    else
    {
        cout << "Incorrect." << endl;
    }

    return 0;
}