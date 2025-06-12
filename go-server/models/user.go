package models



import (
    "time"
    "gorm.io/gorm"
    "github.com/google/uuid"
    // "golang.org/x/crypto/bcrypt"
)

// type User struct {
//     gorm.Model
//     ID                   uuid.UUID `gorm:"type:uuid;primaryKey"` // UUID as PK
//     Username             string    `gorm:"unique;not null"`
//     Password             string    `gorm:"not null" json:"-"` 
//     Email                string    `gorm:"unique;not null"`
//     FullName             string
//     CreatedAt            time.Time `gorm:"not null;default:current_timestamp"`
//     StripeCustomerID     string    `gorm:"unique"`
//     StripeSubscriptionID string
//     SubscriptionStatus   string    `gorm:"default:inactive"`
//     Plan                 string    `gorm:"default:free"`
// }

// func (user *User) BeforeCreate(tx *gorm.DB) (err error) {
//     if user.ID == uuid.Nil {
//         user.ID = uuid.New()
//     }
//     // Hash and salt the password
// 	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
// 	if err != nil {
// 		return err
// 	}
// 	user.Password = string(hashedPassword)

// 	return nil

// }

type User struct {
    gorm.Model
    ID                   uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
    Username             string    `gorm:"unique;not null" json:"username"`
    Password             string    `gorm:"not null" json:"-"` // don't expose password
    Email                string    `gorm:"unique;not null" json:"email"`
    FullName             string    `json:"fullName,omitempty"`
    CreatedAt            time.Time `gorm:"not null;default:current_timestamp" json:"createdAt"`
    StripeCustomerID     string    `json:"stripeCustomerId,omitempty"`
    StripeSubscriptionID string    `json:"stripeSubscriptionId,omitempty"`
    SubscriptionStatus   string    `gorm:"default:inactive" json:"subscriptionStatus,omitempty"`
    Plan                 string    `gorm:"default:free" json:"plan,omitempty"`

    NotificationPreferences NotificationPreferences `gorm:"foreignKey:UserID" json:"-"`
}